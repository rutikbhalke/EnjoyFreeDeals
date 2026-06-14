const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabaseClient");
const { isAutomatedScrapedDeal, toApiDeal } = require("../mappers/dealMapper");
const { isMissingTableError, throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "deal_upvotes";
const DEALS_TABLE = "deals";

async function getUpvotedDeals(userId) {
  const identity = requireIdentity({ userId });

  let query = supabaseAdmin
    .from(TABLE)
    .select("*, deals(*, categories(*), stores(*))")
    .order("created_at", { ascending: false });
  query = applyIdentityFilter(query, identity);

  const { data, error } = await query;
  throwIfUpvoteTableMissing(error);
  throwIfSupabaseError(error, TABLE);

  const deals = (data || [])
    .filter((row) => isAutomatedScrapedDeal(row.deals))
    .map(toApiUpvotedDeal);

  return {
    success: true,
    count: deals.length,
    deals
  };
}

async function upvoteDeal(payload) {
  const dealId = payload.dealId || payload.deal_id;
  requireDealId(dealId);
  const identity = requireIdentity(payload);
  const currentDeal = await getDealSnapshot(dealId);

  if (!currentDeal) {
    const error = new Error("Deal not found.");
    error.statusCode = 404;
    throw error;
  }

  const existing = await getExistingUpvote(identity, dealId);
  if (existing) {
    const count = await refreshDealUpvoteCount(dealId);
    return responsePayload("Already upvoted", true, count, dealId);
  }

  const { error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      deal_id: dealId,
      user_id: identity.user_id || null,
      guest_id: identity.guest_id || null,
      ip_hash: identity.ip_hash || null
    });

  if (isDuplicateUpvoteError(error)) {
    const count = await refreshDealUpvoteCount(dealId);
    return responsePayload("Already upvoted", true, count, dealId);
  }
  throwIfUpvoteTableMissing(error);
  throwIfSupabaseError(error, TABLE);

  const count = await refreshDealUpvoteCount(dealId);
  return responsePayload("Upvote added", true, count, dealId);
}

async function removeUpvote(payload) {
  const dealId = payload.dealId || payload.deal_id;
  requireDealId(dealId);
  const identity = requireIdentity(payload);

  let query = supabaseAdmin
    .from(TABLE)
    .delete()
    .eq("deal_id", dealId)
    .select("id");
  query = applyIdentityFilter(query, identity);

  const { data, error } = await query;
  throwIfUpvoteTableMissing(error);
  throwIfSupabaseError(error, TABLE);

  const removed = (data || []).length > 0;
  const count = await refreshDealUpvoteCount(dealId);
  return responsePayload(removed ? "Upvote removed" : "Upvote was not active", false, count, dealId);
}

async function getDealUpvotes(dealId, payload = {}) {
  requireDealId(dealId);
  const count = await refreshDealUpvoteCount(dealId);
  const identity = normalizeIdentity(payload);
  const upvoted = identity ? Boolean(await getExistingUpvote(identity, dealId)) : false;

  return {
    success: true,
    dealId,
    upvoted,
    upvoteCount: count,
    upvote_count: count
  };
}

async function applyUpvoteState(deals, userId, guestId) {
  const dealList = deals || [];
  const ids = dealList.map((deal) => deal.id).filter(Boolean);
  if (ids.length === 0) return dealList.map(withDefaultUpvoteState);

  const identity = normalizeIdentity({ userId, guestId });
  let upvotedIds = new Set();
  if (identity) {
    let query = supabaseAdmin
      .from(TABLE)
      .select("deal_id")
      .in("deal_id", ids);
    query = applyIdentityFilter(query, identity);

    const { data, error } = await query;
    if (!error) {
      upvotedIds = new Set((data || []).map((row) => row.deal_id));
    } else if (!isMissingTableError(error)) {
      throwIfSupabaseError(error, TABLE);
    }
  }

  return dealList.map((deal) => ({
    ...deal,
    upvote_count: Number(deal.upvote_count || 0),
    upvoteCount: Number(deal.upvote_count || 0),
    user_has_upvoted: upvotedIds.has(deal.id),
    userHasUpvoted: upvotedIds.has(deal.id)
  }));
}

async function getExistingUpvote(identity, dealId) {
  let query = supabaseAdmin
    .from(TABLE)
    .select("id")
    .eq("deal_id", dealId)
    .limit(1);
  query = applyIdentityFilter(query, identity);

  const { data, error } = await query.maybeSingle();
  throwIfUpvoteTableMissing(error);
  throwIfSupabaseError(error, TABLE);
  return data;
}

async function getDealSnapshot(dealId) {
  const { data, error } = await supabaseAdmin
    .from(DEALS_TABLE)
    .select("*, stores(name)")
    .eq("id", dealId)
    .maybeSingle();
  throwIfSupabaseError(error, DEALS_TABLE);
  return data;
}

async function getDealUpvoteCount(dealId) {
  const { count, error } = await supabaseAdmin
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("deal_id", dealId);
  throwIfUpvoteTableMissing(error);
  throwIfSupabaseError(error, TABLE);
  return Number(count || 0);
}

async function refreshDealUpvoteCount(dealId) {
  const count = await getDealUpvoteCount(dealId);
  const { data, error } = await supabaseAdmin
    .from(DEALS_TABLE)
    .update({ upvote_count: count })
    .eq("id", dealId)
    .select("upvote_count")
    .single();
  throwIfUpvoteMigrationMissing(error);
  throwIfSupabaseError(error, DEALS_TABLE);
  return Number(data?.upvote_count ?? count);
}

function toApiUpvotedDeal(row) {
  return {
    id: row.id,
    userId: row.user_id || row.guest_id,
    guestId: row.guest_id,
    dealId: row.deal_id,
    createdAt: row.created_at,
    deal: row.deals ? toApiDeal(row.deals) : null
  };
}

function withDefaultUpvoteState(deal) {
  return {
    ...deal,
    upvote_count: Number(deal.upvote_count || 0),
    upvoteCount: Number(deal.upvote_count || 0),
    user_has_upvoted: false,
    userHasUpvoted: false
  };
}

function responsePayload(message, upvoted, count, dealId) {
  return {
    success: true,
    dealId,
    message,
    upvoted,
    upvoteCount: Number(count || 0),
    upvote_count: Number(count || 0)
  };
}

function requireIdentity(payload) {
  const identity = normalizeIdentity(payload);
  if (!identity) {
    const error = new Error("userId, guestId, or ip hash is required.");
    error.statusCode = 400;
    throw error;
  }
  return identity;
}

function normalizeIdentity(payload = {}) {
  const userId = clean(payload.userId || payload.user_id);
  const guestId = clean(payload.guestId || payload.guest_id);
  const ipHash = clean(payload.ipHash || payload.ip_hash);

  if (isUuid(userId)) return { user_id: userId };
  if (userId) return { guest_id: `user:${userId}` };
  if (guestId) return { guest_id: guestId };
  if (ipHash) return { ip_hash: ipHash };
  return null;
}

function applyIdentityFilter(query, identity) {
  if (identity.user_id) return query.eq("user_id", identity.user_id);
  if (identity.guest_id) return query.eq("guest_id", identity.guest_id);
  return query.eq("ip_hash", identity.ip_hash);
}

function hashRequestIp(req) {
  const forwarded = String(req.get?.("x-forwarded-for") || "").split(",")[0].trim();
  const ip = forwarded || req.ip || req.socket?.remoteAddress || "";
  if (!ip) return "";
  const salt = process.env.UPVOTE_IP_HASH_SALT || process.env.ADMIN_API_SECRET || process.env.ADMIN_SECRET || "enjoyfreedeals-upvotes";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function isDuplicateUpvoteError(error) {
  return error?.code === "23505" || /duplicate key value/i.test(error?.message || "");
}

function throwIfUpvoteTableMissing(error) {
  if (isMissingTableError(error)) {
    const normalized = new Error("deal_upvotes table is missing. Run Supabase migration.");
    normalized.statusCode = 503;
    normalized.code = "DEAL_UPVOTES_TABLE_MISSING";
    throw normalized;
  }
}

function throwIfUpvoteMigrationMissing(error) {
  if (error?.code === "PGRST204" && /upvote_count/i.test(error?.message || "")) {
    const normalized = new Error("deal_upvotes table is missing. Run Supabase migration.");
    normalized.statusCode = 503;
    normalized.code = "DEAL_UPVOTES_TABLE_MISSING";
    throw normalized;
  }
}

function requireDealId(dealId) {
  if (!dealId) {
    const error = new Error("dealId is required.");
    error.statusCode = 400;
    throw error;
  }
}

function clean(value) {
  return String(value || "").trim();
}

module.exports = {
  applyUpvoteState,
  getDealUpvotes,
  getUpvotedDeals,
  hashRequestIp,
  removeUpvote,
  upvoteDeal
};
