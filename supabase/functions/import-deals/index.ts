import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.49.4";
import { fetchSourceDeals } from "./connectors.ts";
import {
  cleanText,
  normalizeSourceDeal,
  shouldPublish,
  validateDeal
} from "./normalizer.ts";
import type {
  DealSourceRow,
  ImportCounts,
  JsonObject,
  NormalizedDeal,
  SourceImportResult
} from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-import-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const maxItemsPerSource = numberEnv("IMPORT_DEALS_MAX_ITEMS", 50);
const staleAfterDays = numberEnv("IMPORT_DEALS_STALE_AFTER_DAYS", 7);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return jsonResponse({ success: true }, 200);
  }

  if (!["GET", "POST"].includes(request.method)) {
    return jsonResponse({ success: false, message: "Method not allowed" }, 405);
  }

  const authError = authorizeRequest(request);
  if (authError) {
    return jsonResponse({ success: false, message: authError }, 401);
  }

  try {
    const body = request.method === "POST" ? await safeJson(request) : {};
    const sourceKey = cleanText(String(body.sourceKey || new URL(request.url).searchParams.get("sourceKey") || ""));
    const force = Boolean(body.force || new URL(request.url).searchParams.get("force") === "true");
    const dryRun = Boolean(body.dryRun || new URL(request.url).searchParams.get("dryRun") === "true");

    const supabase = createAdminClient();
    const sources = await loadDueSources(supabase, sourceKey, force);
    const results: SourceImportResult[] = [];

    for (const source of sources) {
      results.push(await importSource(supabase, source, { dryRun }));
    }

    if (!dryRun && sources.length > 0) {
      await expireStaleDeals(supabase, sources);
    }

    return jsonResponse({
      success: true,
      data: {
        dryRun,
        sourceCount: sources.length,
        totals: summarize(results),
        results
      }
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error instanceof Error ? error.message : "Unknown import error"
    }, 500);
  }
});

function createAdminClient(): SupabaseClient {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function loadDueSources(
  supabase: SupabaseClient,
  sourceKey: string,
  force: boolean
): Promise<DealSourceRow[]> {
  let query = supabase
    .from("deal_sources")
    .select("*")
    .eq("enabled", true)
    .order("source_key", { ascending: true });

  if (sourceKey) query = query.eq("source_key", sourceKey);

  const { data, error } = await query;
  if (error) throw tableError(error, "deal_sources");

  const now = Date.now();
  return (data || []).filter((source) => force || isSourceDue(source as DealSourceRow, now)) as DealSourceRow[];
}

function isSourceDue(source: DealSourceRow, now: number): boolean {
  if (!source.last_run_at) return true;
  const lastRunAt = new Date(source.last_run_at).getTime();
  if (!Number.isFinite(lastRunAt)) return true;
  const intervalMs = Math.max(15, Number(source.run_interval_minutes || 60)) * 60 * 1000;
  return now - lastRunAt >= intervalMs;
}

async function importSource(
  supabase: SupabaseClient,
  source: DealSourceRow,
  options: { dryRun: boolean }
): Promise<SourceImportResult> {
  const counts: ImportCounts = { imported: 0, updated: 0, skipped: 0, failed: 0, needsReview: 0 };
  const startedAt = new Date().toISOString();
  let jobId: string | null = null;

  try {
    const { data: job, error: jobError } = await supabase
      .from("scraper_jobs")
      .insert({
        source_name: source.source_key,
        source_type: source.source_type || "api",
        status: "running",
        started_at: startedAt
      })
      .select("id")
      .single();

    if (jobError) throw tableError(jobError, "scraper_jobs");
    jobId = job.id;

    const sourceDeals = (await fetchSourceDeals(source)).slice(0, maxItemsPerSource);

    for (const item of sourceDeals) {
      try {
        const normalized = normalizeSourceDeal(source, item);
        const validation = validateDeal(normalized, Number(source.trust_level || 1));

        if (!validation.valid) {
          counts.skipped += 1;
          await recordScrapedItem(supabase, jobId, source, normalized, "skipped", validation.errors.join(" "));
          continue;
        }

        if (options.dryRun) {
          counts.skipped += 1;
          await recordScrapedItem(supabase, jobId, source, normalized, "pending", "Dry run; deal was not written.");
          continue;
        }

        const publishNow = shouldPublish(validation, Number(source.trust_level || 1));
        const upsertResult = await upsertDeal(supabase, normalized, {
          status: publishNow ? "active" : "pending",
          isVerified: publishNow,
          reviewReasons: validation.reviewReasons,
          qualityScore: validation.qualityScore
        });

        if (upsertResult.action === "imported") counts.imported += 1;
        if (upsertResult.action === "updated") counts.updated += 1;
        if (!publishNow) counts.needsReview += 1;

        await recordPriceHistoryIfNeeded(supabase, upsertResult.dealId, upsertResult.previousPrice, normalized.discountedPrice);
        await recordScrapedItem(
          supabase,
          jobId,
          source,
          normalized,
          publishNow ? upsertResult.action : "needs_review",
          validation.reviewReasons.join(" ")
        );
      } catch (error) {
        counts.failed += 1;
        await recordRawFailure(supabase, jobId, source, item.sourceProductId, item.sourceUrl, error);
      }
    }

    await finishJob(supabase, jobId, source, counts, "success", "");
    return { ...counts, sourceKey: source.source_key, jobId, status: "success", message: "Imported source deals." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown source import error";
    if (jobId) await finishJob(supabase, jobId, source, counts, "failed", message);
    return { ...counts, sourceKey: source.source_key, jobId, status: "failed", message };
  }
}

async function upsertDeal(
  supabase: SupabaseClient,
  deal: NormalizedDeal,
  publication: { status: "active" | "pending"; isVerified: boolean; reviewReasons: string[]; qualityScore: number }
): Promise<{ action: "imported" | "updated"; dealId: string; previousPrice: number | null }> {
  const { data: existing, error: existingError } = await supabase
    .from("deals")
    .select("id, discounted_price")
    .eq("dedupe_key", deal.dedupeKey)
    .maybeSingle();

  if (existingError) throw tableError(existingError, "deals");

  const now = new Date().toISOString();
  const payload = {
    title: deal.title,
    slug: deal.slug,
    description: deal.description,
    store_id: await ensureStore(supabase, deal),
    category_id: await ensureCategory(supabase, deal),
    original_price: deal.originalPrice,
    discounted_price: deal.discountedPrice,
    discount_percentage: deal.discountPercentage,
    coupon_code: deal.couponCode,
    cashback_percentage: deal.cashbackPercentage,
    affiliate_link: deal.affiliateLink,
    image_url: deal.imageUrl,
    expiry_date: deal.expiryDate,
    status: publication.status,
    is_featured: deal.isFeatured,
    is_verified: publication.isVerified,
    updated_at: now,
    source: deal.dealType,
    source_product_id: deal.sourceProductId,
    source_url: deal.sourceUrl,
    dedupe_key: deal.dedupeKey,
    last_scraped_at: now,
    raw_source_payload: {
      ...deal.rawPayload,
      reviewReasons: publication.reviewReasons,
      qualityScore: publication.qualityScore
    }
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("deals")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) throw tableError(error, "deals");
    return { action: "updated", dealId: data.id, previousPrice: Number(existing.discounted_price || 0) };
  }

  const { data, error } = await supabase
    .from("deals")
    .insert({ ...payload, created_at: now })
    .select("id")
    .single();

  if (error) throw tableError(error, "deals");
  return { action: "imported", dealId: data.id, previousPrice: null };
}

async function ensureStore(supabase: SupabaseClient, deal: NormalizedDeal): Promise<string | null> {
  const { data, error } = await supabase
    .from("stores")
    .upsert({
      name: deal.storeName,
      slug: deal.storeSlug,
      website_url: deal.storeUrl,
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) throw tableError(error, "stores");
  return data?.id || null;
}

async function ensureCategory(supabase: SupabaseClient, deal: NormalizedDeal): Promise<string | null> {
  const { data, error } = await supabase
    .from("categories")
    .upsert({
      name: deal.categoryName,
      slug: deal.categorySlug,
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) throw tableError(error, "categories");
  return data?.id || null;
}

async function recordPriceHistoryIfNeeded(
  supabase: SupabaseClient,
  dealId: string,
  previousPrice: number | null,
  currentPrice: number
): Promise<void> {
  if (previousPrice !== null && Math.abs(previousPrice - currentPrice) < 0.01) return;

  const { error } = await supabase
    .from("price_history")
    .insert({ deal_id: dealId, price: currentPrice });

  if (error) throw tableError(error, "price_history");
}

async function recordScrapedItem(
  supabase: SupabaseClient,
  jobId: string | null,
  source: DealSourceRow,
  deal: NormalizedDeal,
  status: string,
  errorMessage: string
): Promise<void> {
  const { error } = await supabase
    .from("scraped_deal_items")
    .insert({
      scraper_job_id: jobId,
      deal_source_id: source.id,
      source_key: source.source_key,
      source_product_id: deal.sourceProductId,
      source_url: deal.sourceUrl,
      title: deal.title,
      raw_payload: deal.rawPayload,
      normalized_payload: deal as unknown as JsonObject,
      dedupe_key: deal.dedupeKey,
      status,
      error_message: errorMessage
    });

  if (error) throw tableError(error, "scraped_deal_items");
}

async function recordRawFailure(
  supabase: SupabaseClient,
  jobId: string | null,
  source: DealSourceRow,
  sourceProductId: string,
  sourceUrl: string,
  error: unknown
): Promise<void> {
  const { error: insertError } = await supabase
    .from("scraped_deal_items")
    .insert({
      scraper_job_id: jobId,
      deal_source_id: source.id,
      source_key: source.source_key,
      source_product_id: sourceProductId || "",
      source_url: sourceUrl || "",
      title: "",
      raw_payload: {},
      normalized_payload: {},
      dedupe_key: "",
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown item import error"
    });

  if (insertError) console.error("Failed to record raw item failure", insertError);
}

async function finishJob(
  supabase: SupabaseClient,
  jobId: string,
  source: DealSourceRow,
  counts: ImportCounts,
  status: "success" | "failed",
  errorMessage: string
): Promise<void> {
  const finishedAt = new Date().toISOString();
  const { error: jobError } = await supabase
    .from("scraper_jobs")
    .update({
      status,
      imported_count: counts.imported,
      updated_count: counts.updated,
      skipped_count: counts.skipped,
      error_message: errorMessage,
      finished_at: finishedAt
    })
    .eq("id", jobId);

  if (jobError) throw tableError(jobError, "scraper_jobs");

  const { error: sourceError } = await supabase
    .from("deal_sources")
    .update({ last_run_at: finishedAt, updated_at: finishedAt })
    .eq("id", source.id);

  if (sourceError) throw tableError(sourceError, "deal_sources");
}

async function expireStaleDeals(supabase: SupabaseClient, sources: DealSourceRow[]): Promise<void> {
  const cutoff = new Date(Date.now() - staleAfterDays * 24 * 60 * 60 * 1000).toISOString();

  for (const source of sources) {
    const { error } = await supabase
      .from("deals")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("status", "active")
      .lt("last_scraped_at", cutoff)
      .contains("raw_source_payload", { sourceKey: source.source_key });

    if (error) throw tableError(error, "deals");
  }
}

function summarize(results: SourceImportResult[]): ImportCounts {
  return results.reduce(
    (totals, result) => ({
      imported: totals.imported + result.imported,
      updated: totals.updated + result.updated,
      skipped: totals.skipped + result.skipped,
      failed: totals.failed + result.failed,
      needsReview: totals.needsReview + result.needsReview
    }),
    { imported: 0, updated: 0, skipped: 0, failed: 0, needsReview: 0 }
  );
}

function authorizeRequest(request: Request): string | null {
  const expectedSecret = Deno.env.get("IMPORT_DEALS_CRON_SECRET");
  if (!expectedSecret) return "IMPORT_DEALS_CRON_SECRET is not configured.";
  const actualSecret = request.headers.get("x-import-secret") || "";
  return actualSecret === expectedSecret ? null : "Invalid import secret.";
}

async function safeJson(request: Request): Promise<JsonObject> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function jsonResponse(payload: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is required for import-deals.`);
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const value = Number(Deno.env.get(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function tableError(error: { message?: string; code?: string }, tableName: string): Error {
  if (error.code === "42P01") {
    return new Error(`Table not found. Please create Supabase tables first. Missing table: ${tableName}`);
  }
  return new Error(error.message || `Supabase error on ${tableName}`);
}
