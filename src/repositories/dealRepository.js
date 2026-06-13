const { supabaseAdmin } = require("../config/supabaseClient");
const { normalizeDealPayload, toApiDeal } = require("../mappers/dealMapper");
const { applyUpvoteState } = require("./upvotedDealRepository");
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

  let { data, error, count } = await query;
  if (isMissingOptionalDealColumn(error)) {
    const fallback = await buildBaseListQuery(filters, from, to);
    data = fallback.data;
    error = fallback.error;
    count = fallback.count;
  }
  throwIfSupabaseError(error, TABLE);
  const mappedDeals = (data || [])
    .map(toApiDeal)
    .filter((deal) => deal.isValid && !deal.isExpired)
    .filter((deal) => filterByPlatform(deal, filters.platform));
  if (filters.sort === "score") {
    mappedDeals.sort((a, b) => Number(b.dealScore || 0) - Number(a.dealScore || 0));
  }
  const dealsWithUpvotes = await applyUpvoteState(mappedDeals, filters.userId || filters.user_id);

  return {
    deals: dealsWithUpvotes,
    pagination: {
      page,
      limit,
      total: filters.platform ? mappedDeals.length : count || 0,
      totalPages: Math.ceil((filters.platform ? mappedDeals.length : count || 0) / limit)
    }
  };
}

async function getDealById(id, userId) {
  let { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, categories(*), stores(*)")
    .eq("id", id)
    .eq("status", "active")
    .not("last_scraped_at", "is", null)
    .not("dedupe_key", "is", null)
    .neq("source_url", "")
    .in("raw_source_payload->>connectorMode", ["html-scrape", "telegram-bot", "telegram-page", "telegram-channel", "direct-platform-fetch"])
    .maybeSingle();
  if (isMissingOptionalDealColumn(error)) {
    const fallback = await supabaseAdmin
      .from(TABLE)
      .select("*, categories(*), stores(*)")
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }
  throwIfSupabaseError(error, TABLE);
  const deal = data ? toApiDeal(data) : null;
  if (!deal || !deal.isValid || deal.isExpired) return null;
  const [dealWithUpvotes] = await applyUpvoteState([deal], userId);
  return dealWithUpvotes;
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
  return query
    .eq("status", "active")
    .gte("discounted_price", 0)
    .or(nonExpiredDealFilter())
    .not("last_scraped_at", "is", null)
    .not("dedupe_key", "is", null)
    .neq("source_url", "")
    .in("raw_source_payload->>connectorMode", ["html-scrape", "telegram-bot", "telegram-page", "telegram-channel", "direct-platform-fetch"]);
}

async function buildBaseListQuery(filters, from, to) {
  let query = supabaseAdmin
    .from(TABLE)
    .select("*, categories(*), stores(*)", { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.search) {
    const search = escapeIlike(filters.search.trim());
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,coupon_code.ilike.%${search}%,source.ilike.%${search}%`);
  }

  if (filters.category) {
    const categoryId = await resolveCategoryId(filters.category);
    query = categoryId ? query.eq("category_id", categoryId) : query.eq("category_id", "00000000-0000-0000-0000-000000000000");
  }

  if (filters.dealType) query = query.eq("source", filters.dealType);
  if (String(filters.hot || "").toLowerCase() === "true") query = query.eq("is_featured", true);
  if (filters.sort === "discount" || filters.sort === "score") query = query.order("discount_percentage", { ascending: false });
  if (filters.sort === "price") query = query.order("discounted_price", { ascending: true });
  return query;
}

function isMissingOptionalDealColumn(error) {
  return /column .* does not exist|could not find .* column|schema cache/i.test(error?.message || "");
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
  const requestedKeys = categoryLookupKeys(category);
  const match = (data || []).find((item) =>
    requestedKeys.has(normalizeCategoryKey(item.id)) ||
    requestedKeys.has(normalizeCategoryKey(item.slug)) ||
    requestedKeys.has(normalizeCategoryKey(item.name))
  );
  return match?.id || null;
}

function normalizeCategoryKey(value) {
  return rawCategoryKey(value);
}

function rawCategoryKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function categoryLookupKeys(value) {
  const raw = rawCategoryKey(value);
  return new Set([raw, CATEGORY_ALIASES[raw]].filter(Boolean));
}

const CATEGORY_ALIASES = {
  mobile: "mobiles",
  mobiles: "mobile",
  "mobile-phone": "mobiles",
  "mobile-phones": "mobiles",
  smartphone: "mobiles",
  smartphones: "mobiles",
  home: "home-and-kitchen",
  kitchen: "home-and-kitchen",
  "home-kitchen": "home-and-kitchen",
  coupon: "coupons",
  recharge: "recharge-offers",
  "recharge-offer": "recharge-offers",
  bank: "bank-offers",
  "bank-offer": "bank-offers",
  cashback: "bank-offers",
  student: "student-deals",
  festival: "festival-deals",
  shoe: "footwear",
  shoes: "footwear",
  watch: "watches",
  bag: "bags",
  personal: "personal-care",
  "baby-product": "baby-products",
  book: "books",
  game: "gaming",
  food: "food-offers",
  travel: "travel",
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
