const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabaseClient");
const { isAutomatedScrapedDeal, toApiDeal } = require("../mappers/dealMapper");
const { isMissingTableError, throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "deal_upvotes";
const LEGACY_TABLE = "upvoted_deals";
const DEALS_TABLE = "deals";

async function getUpvotedDeals(userId) {
  const identity = requireIdentity({ userId });

  return withUpvoteTable(async (table, legacy) => {
    let query = supabaseAdmin
      .from(table)
      .select("*, deals(*, categories(*), stores(*))")
      .order("created_at", { ascending: false });
    query = applyIdentityFilter(query, identity, legacy);

    const { data, error } = await query;
    throwIfUpvoteTableMissing(error);
    throwIfSupabaseError(error, table);

    const deals = (data || [])
      .filter((row) => isAutomatedScrapedDeal(row.deals))
      .map(toApiUpvotedDeal);

    return {
      success: true,
      count: deals.length,
      deals
    };
  }).catch((error) => {
    if (error.code !== "DEAL_UPVOTES_TABLE_MISSING") throw error;
    return { success: true, count: 0, deals: [] };
  });
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

  return withUpvoteTable(async (table, legacy) => {
    const existing = await getExistingUpvote(identity, dealId, table, legacy);
    if (existing) {
      const count = await refreshDealUpvoteCount(dealId, table);
      return responsePayload("Already upvoted", true, count, dealId);
    }

    const insertPayload = legacy ? legacyInsertPayload(identity, dealId, currentDeal) : {
      deal_id: dealId,
      user_id: identity.user_id || null,
      guest_id: identity.guest_id || null,
      ip_hash: identity.ip_hash || null
    };
    const { error } = await supabaseAdmin
      .from(table)
      .insert(insertPayload);

    if (isDuplicateUpvoteError(error)) {
      const count = await refreshDealUpvoteCount(dealId, table);
      return responsePayload("Already upvoted", true, count, dealId);
    }
    throwIfUpvoteTableMissing(error);
    throwIfSupabaseError(error, table);

    const count = await refreshDealUpvoteCount(dealId, table);
    return responsePayload("Upvote added", true, count, dealId);
  }).catch((error) => {
    if (error.code !== "DEAL_UPVOTES_TABLE_MISSING") throw error;
    return counterOnlyUpvote(dealId, currentDeal);
  });
}

async function removeUpvote(payload) {
  const dealId = payload.dealId || payload.deal_id;
  requireDealId(dealId);
  const identity = requireIdentity(payload);

  return withUpvoteTable(async (table, legacy) => {
    let query = supabaseAdmin
      .from(table)
      .delete()
      .eq("deal_id", dealId)
      .select("id");
    query = applyIdentityFilter(query, identity, legacy);

    const { data, error } = await query;
    throwIfUpvoteTableMissing(error);
    throwIfSupabaseError(error, table);

    const removed = (data || []).length > 0;
    const count = await refreshDealUpvoteCount(dealId, table);
    return responsePayload(removed ? "Upvote removed" : "Upvote was not active", false, count, dealId);
  }).catch(async (error) => {
    if (error.code !== "DEAL_UPVOTES_TABLE_MISSING") throw error;
    const currentDeal = await getDealSnapshot(dealId);
    const count = await updateCounterOnly(dealId, Math.max(0, Number(currentDeal?.upvote_count || 0) - 1));
    return responsePayload("Upvote was not active", false, count, dealId);
  });
}

async function getDealUpvotes(dealId, payload = {}) {
  requireDealId(dealId);
  const identity = normalizeIdentity(payload);
  return withUpvoteTable(async (table, legacy) => {
    const count = await refreshDealUpvoteCount(dealId, table);
    const upvoted = identity ? Boolean(await getExistingUpvote(identity, dealId, table, legacy)) : false;

    return {
      success: true,
      dealId,
      upvoted,
      upvoteCount: count,
      upvote_count: count
    };
  }).catch(async (error) => {
    if (error.code !== "DEAL_UPVOTES_TABLE_MISSING") throw error;
    const deal = await getDealSnapshot(dealId);
    const count = Number(deal?.upvote_count || 0);
    return {
      success: true,
      dealId,
      upvoted: false,
      upvoteCount: count,
      upvote_count: count
    };
  });
}

async function applyUpvoteState(deals, userId, guestId) {
  const dealList = deals || [];
  const ids = dealList.map((deal) => deal.id).filter(Boolean);
  if (ids.length === 0) return dealList.map(withDefaultUpvoteState);

  const identity = normalizeIdentity({ userId, guestId });
  let upvotedIds = new Set();
  if (identity) {
    await withUpvoteTable(async (table, legacy) => {
      let query = supabaseAdmin
        .from(table)
        .select("deal_id")
        .in("deal_id", ids);
      query = applyIdentityFilter(query, identity, legacy);

      const { data, error } = await query;
      throwIfUpvoteTableMissing(error);
      throwIfSupabaseError(error, table);
      upvotedIds = new Set((data || []).map((row) => row.deal_id));
      return null;
    }).catch((error) => {
      if (error.code !== "DEAL_UPVOTES_TABLE_MISSING") throw error;
    });
  }

  return dealList.map((deal) => ({
    ...deal,
    upvote_count: Number(deal.upvote_count || 0),
    upvoteCount: Number(deal.upvote_count || 0),
    user_has_upvoted: upvotedIds.has(deal.id),
    userHasUpvoted: upvotedIds.has(deal.id)
  }));
}

async function getExistingUpvote(identity, dealId, table = TABLE, legacy = false) {
  let query = supabaseAdmin
    .from(table)
    .select("id")
    .eq("deal_id", dealId)
    .limit(1);
  query = applyIdentityFilter(query, identity, legacy);

  const { data, error } = await query.maybeSingle();
  throwIfUpvoteTableMissing(error);
  throwIfSupabaseError(error, table);
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

async function getDealUpvoteCount(dealId, table = TABLE) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("deal_id", dealId);
  throwIfUpvoteTableMissing(error);
  throwIfSupabaseError(error, table);
  return Number(count || 0);
}

async function refreshDealUpvoteCount(dealId, table = TABLE) {
  const count = await getDealUpvoteCount(dealId, table);
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

function applyIdentityFilter(query, identity, legacy = false) {
  if (legacy) return query.eq("user_id", legacyUserId(identity));
  if (identity.user_id) return query.eq("user_id", identity.user_id);
  if (identity.guest_id) return query.eq("guest_id", identity.guest_id);
  return query.eq("ip_hash", identity.ip_hash);
}

async function withUpvoteTable(operation) {
  try {
    return await operation(TABLE, false);
  } catch (error) {
    if (!isUpvoteTableMissingError(error)) throw error;
  }

  try {
    return await operation(LEGACY_TABLE, true);
  } catch (error) {
    if (isUpvoteTableMissingError(error)) {
      const normalized = new Error("deal_upvotes table is missing. Run Supabase migration.");
      normalized.statusCode = 503;
      normalized.code = "DEAL_UPVOTES_TABLE_MISSING";
      throw normalized;
    }
    throw error;
  }
}

function legacyInsertPayload(identity, dealId, deal) {
  return {
    user_id: legacyUserId(identity),
    deal_id: dealId,
    product_title: deal.title || "",
    platform: deal.stores?.name || deal.store_name || "",
    deal_price: deal.discounted_price ?? deal.deal_price ?? null,
    original_price: deal.original_price ?? null,
    discount_percent: deal.discount_percentage ?? null,
    product_url: deal.affiliate_link || deal.source_url || deal.platform_product_url || "",
    image_url: deal.image_url || deal.final_image_url || deal.source_image_url || ""
  };
}

function legacyUserId(identity) {
  if (identity.user_id) return identity.user_id;
  if (identity.guest_id) return identity.guest_id;
  return `ip:${identity.ip_hash}`;
}

function isUpvoteTableMissingError(error) {
  return error?.code === "DEAL_UPVOTES_TABLE_MISSING" || error?.code === "TABLE_NOT_FOUND";
}

async function counterOnlyUpvote(dealId, currentDeal) {
  const count = await updateCounterOnly(dealId, Number(currentDeal?.upvote_count || 0) + 1);
  return {
    ...responsePayload("Upvote added", true, count, dealId),
    migrationRequired: true
  };
}

async function updateCounterOnly(dealId, count) {
  const { data, error } = await supabaseAdmin
    .from(DEALS_TABLE)
    .update({ upvote_count: count })
    .eq("id", dealId)
    .select("upvote_count")
    .single();
  if (error?.code === "PGRST204" && /upvote_count/i.test(error?.message || "")) {
    return Number(count || 0);
  }
  throwIfUpvoteMigrationMissing(error);
  throwIfSupabaseError(error, DEALS_TABLE);
  return Number(data?.upvote_count ?? count);
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
