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
        await syncPriceComparison(supabase, upsertResult.dealId, normalized);
        await recordScrapedItem(
          supabase,
          jobId,
          source,
          normalized,
          publishNow ? upsertResult.action : "needs_review",
          validation.reviewReasons.join(" "),
          upsertResult.dealId
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
    source_image_url: deal.imageUrl,
    platform_product_url: deal.affiliateLink || deal.sourceUrl,
    expiry_date: deal.expiryDate,
    platform_expires_at: deal.expiryDate,
    source_updated_at: deal.rawPayload.sourceUpdatedAt || deal.rawPayload.capturedAt || deal.rawPayload.normalizedAt || null,
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

async function syncPriceComparison(
  supabase: SupabaseClient,
  dealId: string,
  deal: NormalizedDeal
): Promise<void> {
  const comparisonKey = String(deal.rawPayload.comparisonKey || "");
  if (!comparisonKey) return;

  const { data, error } = await supabase
    .from("deals")
    .select("id, title, original_price, discounted_price, discount_percentage, affiliate_link, source_url, coupon_code, image_url, updated_at, stores(name), categories(name)")
    .eq("status", "active")
    .or(`expiry_date.is.null,expiry_date.gt.${new Date().toISOString()}`)
    .limit(250);

  if (error) throw tableError(error, "deals");

  const matches = bestPricePerStore((data || [])
    .map(toComparableDeal)
    .filter((candidate) => candidate.price > 0)
    .filter((candidate) => isActualProductUrl(candidate.storeName, candidate.url))
    .filter((candidate) => candidate.id === dealId || titleSimilarity(comparisonKey, candidate.title) >= 0.55));

  const distinctStores = new Set(matches.map((candidate) => candidate.storeName.toLowerCase()).filter(Boolean));
  if (matches.length < 2 || distinctStores.size < 2) return;

  const canonical = [...matches].sort((a, b) => a.price - b.price)[0];
  const bestOriginalPrice = Math.max(...matches.map((candidate) => candidate.originalPrice || candidate.price));
  const lowestPrice = canonical.price;
  const discountPercentage = calculateDiscount(bestOriginalPrice, lowestPrice);

  const { data: comparison, error: comparisonError } = await supabase
    .from("price_comparisons")
    .upsert({
      deal_id: canonical.id,
      product_name: canonical.title,
      image_url: canonical.imageUrl,
      category: canonical.categoryName,
      original_price: bestOriginalPrice,
      lowest_price: lowestPrice,
      discount_percentage: discountPercentage,
      product_url: canonical.url,
      store_name: canonical.storeName,
      coupon_code: canonical.couponCode,
      rating: 4.2,
      is_hot_deal: discountPercentage >= 50,
      is_free_deal: lowestPrice === 0,
      last_updated: new Date().toISOString()
    }, { onConflict: "deal_id" })
    .select("id")
    .single();

  if (comparisonError) throw tableError(comparisonError, "price_comparisons");

  const { error: deleteError } = await supabase
    .from("price_comparison_platforms")
    .delete()
    .eq("comparison_id", comparison.id);

  if (deleteError) throw tableError(deleteError, "price_comparison_platforms");

  const platforms = matches
    .sort((a, b) => a.price - b.price)
    .map((candidate) => ({
      comparison_id: comparison.id,
      platform: candidate.storeName,
      price: candidate.price,
      product_url: candidate.url,
      affiliate_url: candidate.url,
      available: true,
      delivery_info: "See store",
      rating: 4.2,
      coupon_code: candidate.couponCode,
      last_updated: new Date().toISOString()
    }));

  const { error: platformError } = await supabase
    .from("price_comparison_platforms")
    .insert(platforms);

  if (platformError) throw tableError(platformError, "price_comparison_platforms");
}

async function recordScrapedItem(
  supabase: SupabaseClient,
  jobId: string | null,
  source: DealSourceRow,
  deal: NormalizedDeal,
  status: string,
  errorMessage: string,
  matchedDealId: string | null = null
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
      error_message: errorMessage,
      matched_deal_id: matchedDealId
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

function toComparableDeal(row: Record<string, unknown>) {
  const store = row.stores && typeof row.stores === "object" ? row.stores as Record<string, unknown> : {};
  const category = row.categories && typeof row.categories === "object" ? row.categories as Record<string, unknown> : {};
  const url = String(row.affiliate_link || row.source_url || "");
  return {
    id: String(row.id || ""),
    title: String(row.title || ""),
    originalPrice: Number(row.original_price || 0),
    price: Number(row.discounted_price || 0),
    discountPercentage: Number(row.discount_percentage || 0),
    url,
    couponCode: String(row.coupon_code || ""),
    imageUrl: String(row.image_url || ""),
    storeName: String(store.name || ""),
    categoryName: String(category.name || "")
  };
}

function bestPricePerStore(candidates: ReturnType<typeof toComparableDeal>[]): ReturnType<typeof toComparableDeal>[] {
  const byStore = new Map<string, ReturnType<typeof toComparableDeal>>();

  for (const candidate of candidates) {
    const key = candidate.storeName.toLowerCase();
    if (!key) continue;
    const existing = byStore.get(key);
    if (!existing || candidate.price < existing.price) {
      byStore.set(key, candidate);
    }
  }

  return [...byStore.values()];
}

function isActualProductUrl(platform: string, value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = decodeURIComponent(url.pathname || "").toLowerCase();
    const key = platform.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (!path || path === "/") return false;
    if (key === "amazon") return /\/(dp|gp\/product)\/[a-z0-9]{8,}/i.test(path);
    if (key === "flipkart") return host.includes("flipkart.") && (path.includes("/p/") || path.includes("/itm"));
    if (key === "meesho") return host.includes("meesho.") && path.includes("/p/");
    if (key === "myntra") return host.includes("myntra.") && (path.includes("/buy") || path.includes("/product/"));
    if (["ajio", "croma", "nykaa"].includes(key)) return path.includes("/p/");
    if (key === "tatacliq") return path.includes("/p-");
    return path.split("/").filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

function titleSimilarity(comparisonKey: string, title: string): number {
  const sourceTokens = tokenSet(comparisonKey);
  const targetTokens = tokenSet(title);
  if (sourceTokens.size === 0 || targetTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of sourceTokens) {
    if (targetTokens.has(token)) overlap += 1;
  }

  return overlap / Math.max(sourceTokens.size, targetTokens.size);
}

function tokenSet(value: string): Set<string> {
  return new Set(
    cleanText(value)
      .toLowerCase()
      .replace(/\b(offer|deal|discount|sale|with|and|the|for|new|latest)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter((token) => token.length > 2)
  );
}

function calculateDiscount(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)));
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
