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
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.search) {
    const search = escapeIlike(filters.search.trim());
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,coupon_code.ilike.%${search}%,source.ilike.%${search}%`);
  }

  if (filters.category) {
    const categoryId = await resolveCategoryId(filters.category);
    query = categoryId ? query.eq("category_id", categoryId) : query.eq("category_id", filters.category);
  }

  if (filters.dealType) {
    query = query.eq("source", filters.dealType);
  }

  const { data, error, count } = await query;
  throwIfSupabaseError(error, TABLE);

  return {
    deals: (data || []).map(toApiDeal),
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

async function getDealById(id) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, categories(*), stores(*)")
    .eq("id", id)
    .maybeSingle();
  throwIfSupabaseError(error, TABLE);
  return data ? toApiDeal(data) : null;
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

async function resolveCategoryId(category) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id,name,slug");

  if (error) return null;
  const normalized = String(category).toLowerCase();
  const match = (data || []).find((item) =>
    String(item.id).toLowerCase() === normalized ||
    String(item.slug || "").toLowerCase() === normalized ||
    String(item.name || "").toLowerCase() === normalized
  );
  return match?.id || null;
}

module.exports = {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  softDeleteDeal
};
