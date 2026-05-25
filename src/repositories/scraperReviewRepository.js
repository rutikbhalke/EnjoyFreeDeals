const { supabaseAdmin } = require("../config/supabaseClient");
const { toApiDeal } = require("../mappers/dealMapper");
const { getPagination } = require("../utils/pagination");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "scraped_deal_items";

async function listScrapedDeals(filters) {
  const { page, limit, from, to } = getPagination(filters);
  let query = supabaseAdmin
    .from(TABLE)
    .select("*, deal_sources(source_name), deals(*, categories(*), stores(*))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status) {
    query = query.eq("status", normalizeStatus(filters.status));
  }

  if (filters.sourceKey) {
    query = query.eq("source_key", String(filters.sourceKey));
  }

  const { data, error, count } = await query;
  throwIfSupabaseError(error, TABLE);

  return {
    items: (data || []).map(toApiScrapedDealItem),
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

async function approveScrapedDeal(itemId) {
  const item = await findScrapedItem(itemId);
  const dealId = await resolveMatchedDealId(item);
  if (!dealId) {
    const error = new Error("No matched deal found for this scraped item.");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date().toISOString();
  const { data: deal, error: dealError } = await supabaseAdmin
    .from("deals")
    .update({ status: "active", is_verified: true, updated_at: now })
    .eq("id", dealId)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(dealError, "deals");

  const { data: updatedItem, error: itemError } = await supabaseAdmin
    .from(TABLE)
    .update({ status: "approved", matched_deal_id: dealId, error_message: "" })
    .eq("id", itemId)
    .select("*, deal_sources(source_name), deals(*, categories(*), stores(*))")
    .single();
  throwIfSupabaseError(itemError, TABLE);

  return {
    item: toApiScrapedDealItem(updatedItem),
    deal: toApiDeal(deal)
  };
}

async function rejectScrapedDeal(itemId, reason = "") {
  const item = await findScrapedItem(itemId);
  const dealId = await resolveMatchedDealId(item);
  const now = new Date().toISOString();

  if (dealId) {
    const { error: dealError } = await supabaseAdmin
      .from("deals")
      .update({ status: "rejected", is_verified: false, updated_at: now })
      .eq("id", dealId);
    throwIfSupabaseError(dealError, "deals");
  }

  const { data: updatedItem, error: itemError } = await supabaseAdmin
    .from(TABLE)
    .update({
      status: "rejected",
      matched_deal_id: dealId,
      error_message: reason || "Rejected by admin review."
    })
    .eq("id", itemId)
    .select("*, deal_sources(source_name), deals(*, categories(*), stores(*))")
    .single();
  throwIfSupabaseError(itemError, TABLE);

  return toApiScrapedDealItem(updatedItem);
}

async function findScrapedItem(itemId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, deal_sources(source_name), deals(*, categories(*), stores(*))")
    .eq("id", itemId)
    .maybeSingle();
  throwIfSupabaseError(error, TABLE);

  if (!data) {
    const notFound = new Error("Scraped deal item not found.");
    notFound.statusCode = 404;
    throw notFound;
  }

  return data;
}

async function resolveMatchedDealId(item) {
  if (item.matched_deal_id) return item.matched_deal_id;
  if (!item.dedupe_key) return null;

  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id")
    .eq("dedupe_key", item.dedupe_key)
    .maybeSingle();
  throwIfSupabaseError(error, "deals");
  return data?.id || null;
}

function toApiScrapedDealItem(row) {
  return {
    id: row.id,
    jobId: row.scraper_job_id,
    sourceKey: row.source_key,
    sourceName: row.deal_sources?.source_name || row.source_key,
    sourceProductId: row.source_product_id,
    sourceUrl: row.source_url,
    title: row.title,
    dedupeKey: row.dedupe_key,
    status: row.status,
    errorMessage: row.error_message,
    matchedDealId: row.matched_deal_id,
    rawPayload: row.raw_payload,
    normalizedPayload: row.normalized_payload,
    createdAt: row.created_at,
    deal: row.deals ? toApiDeal(row.deals) : null
  };
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

module.exports = {
  approveScrapedDeal,
  listScrapedDeals,
  rejectScrapedDeal
};
