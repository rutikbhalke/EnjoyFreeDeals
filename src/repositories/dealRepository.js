const { supabaseAdmin } = require("../config/supabaseClient");
const { normalizeDealPayload, toApiDeal } = require("../mappers/dealMapper");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");
const { getPagination } = require("../utils/pagination");

const TABLE = "deals";

async function listDeals(filters) {
  const { page, limit, from, to } = getPagination(filters);
  let query = supabaseAdmin
    .from(TABLE)
    .select("*, categories(*), stores(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  query = applyPublicDealVisibility(query);

  if (filters.search) {
    const search = escapeIlike(filters.search.trim());
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,coupon_code.ilike.%${search}%,source.ilike.%${search}%`);
  }

  if (filters.category) {
    const categoryId = await resolveCategoryId(filters.category);
    query = categoryId ? query.eq("category_id", categoryId) : query.eq("category_id", "00000000-0000-0000-0000-000000000000");
  }

  if (filters.dealType) {
    query = query.eq("source", filters.dealType);
  }

  if (String(filters.hot || "").toLowerCase() === "true") {
    query = query.eq("is_featured", true);
  }

  if (filters.sort === "discount" || filters.sort === "score") {
    query = query.order("discount_percentage", { ascending: false });
  } else if (filters.sort === "price") {
    query = query.order("discounted_price", { ascending: true });
  } else if (filters.sort === "newest") {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;
  throwIfSupabaseError(error, TABLE);
  const mappedDeals = (data || [])
    .map(toApiDeal)
    .filter((deal) => deal.isValid && !deal.isExpired)
    .filter((deal) => filterByPlatform(deal, filters.platform));

  return {
    deals: mappedDeals,
    pagination: {
      page,
      limit,
      total: filters.platform ? mappedDeals.length : count || 0,
      totalPages: Math.ceil((filters.platform ? mappedDeals.length : count || 0) / limit)
    }
  };
}

async function getDealById(id) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, categories(*), stores(*)")
    .eq("id", id)
    .eq("status", "active")
    .not("last_scraped_at", "is", null)
    .not("dedupe_key", "is", null)
    .neq("source_url", "")
    .in("raw_source_payload->>connectorMode", ["html-scrape", "telegram-bot", "telegram-page", "direct-platform-fetch"])
    .or(nonExpiredDealFilter())
    .maybeSingle();
  throwIfSupabaseError(error, TABLE);
  const deal = data ? toApiDeal(data) : null;
  return deal && deal.isValid && !deal.isExpired ? deal : null;
}

async function createDeal(payload) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert(normalizeDealPayload(payload))
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, TABLE);
  return toApiDeal(data);
}

async function updateDeal(id, payload) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ ...normalizeDealPayload(payload), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, TABLE);
  return toApiDeal(data);
}

async function softDeleteDeal(id) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, TABLE);
  return toApiDeal(data);
}

function escapeIlike(value) {
  return value.replace(/[%(),]/g, "\\$&");
}

function applyPublicDealVisibility(query) {
  const updatedCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return query
    .eq("status", "active")
    .gte("discounted_price", 0)
    .gte("updated_at", updatedCutoff)
    .not("last_scraped_at", "is", null)
    .not("dedupe_key", "is", null)
    .neq("source_url", "")
    .in("raw_source_payload->>connectorMode", ["html-scrape", "telegram-bot", "telegram-page", "direct-platform-fetch"])
    .or(nonExpiredDealFilter());
}

function nonExpiredDealFilter() {
  const now = new Date().toISOString();
  return `platform_expires_at.is.null,platform_expires_at.gt.${now}`;
}

async function resolveCategoryId(category) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id,name,slug");

  if (error) return null;
  const normalized = normalizeCategoryKey(category);
  const match = (data || []).find((item) =>
    normalizeCategoryKey(item.id) === normalized ||
    normalizeCategoryKey(item.slug) === normalized ||
    normalizeCategoryKey(item.name) === normalized
  );
  return match?.id || null;
}

function normalizeCategoryKey(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return CATEGORY_ALIASES[normalized] || normalized;
}

const CATEGORY_ALIASES = {
  mobiles: "mobile",
  "mobile-phone": "mobile",
  "mobile-phones": "mobile",
  smartphone: "mobile",
  smartphones: "mobile",
  home: "home-and-kitchen",
  kitchen: "home-and-kitchen",
  "home-kitchen": "home-and-kitchen",
  "amazon-deal": "amazon-deals",
  amazon: "amazon-deals",
  "flipkart-deal": "flipkart-deals",
  flipkart: "flipkart-deals",
  appliance: "appliances",
  general: "other-deals",
  other: "other-deals"
};

function filterByPlatform(deal, platform) {
  if (!platform) return true;
  const expected = String(platform).trim().toLowerCase();
  return String(deal.storeName || "").toLowerCase().includes(expected) ||
    String(deal.rawSourcePayload?.platform || "").toLowerCase().includes(expected);
}

module.exports = {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  softDeleteDeal
};
