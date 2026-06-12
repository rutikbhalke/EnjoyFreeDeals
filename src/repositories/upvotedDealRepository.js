const { supabaseAdmin } = require("../config/supabaseClient");
const { isAutomatedScrapedDeal, toApiDeal } = require("../mappers/dealMapper");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "upvoted_deals";
const DEALS_TABLE = "deals";

async function getUpvotedDeals(userId) {
  requireUserId(userId);

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, deals(*, categories(*), stores(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
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
  const userId = payload.userId || payload.user_id;
  const dealId = payload.dealId || payload.deal_id;
  requireUserId(userId);
  requireDealId(dealId);

  const existing = await getExistingUpvote(userId, dealId);
  const currentDeal = await getDealSnapshot(dealId);
  if (existing) {
    return responsePayload("Deal already upvoted", true, currentDeal?.upvote_count || 0);
  }

  const { error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      user_id: userId,
      deal_id: dealId,
      product_title: currentDeal?.title || payload.productTitle || payload.product_title || null,
      platform: currentDeal?.stores?.name || payload.platform || null,
      deal_price: currentDeal?.discounted_price ?? payload.dealPrice ?? payload.deal_price ?? null,
      original_price: currentDeal?.original_price ?? payload.originalPrice ?? payload.original_price ?? null,
      discount_percent: currentDeal?.discount_percentage ?? payload.discountPercent ?? payload.discount_percent ?? null,
      product_url: currentDeal?.affiliate_link || currentDeal?.source_url || payload.productUrl || payload.product_url || null,
      image_url: currentDeal?.image_url || currentDeal?.source_image_url || payload.imageUrl || payload.image_url || null
    });
  throwIfSupabaseError(error, TABLE);

  const count = await setDealUpvoteCount(dealId, 1);
  return responsePayload("Deal upvoted successfully", true, count);
}

async function removeUpvote(payload) {
  const userId = payload.userId || payload.user_id;
  const dealId = payload.dealId || payload.deal_id;
  requireUserId(userId);
  requireDealId(dealId);

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("deal_id", dealId)
    .select("id");
  throwIfSupabaseError(error, TABLE);

  const removed = (data || []).length > 0;
  const count = removed ? await setDealUpvoteCount(dealId, -1) : await getDealUpvoteCount(dealId);
  return responsePayload(removed ? "Upvote removed" : "Upvote was not active", false, count);
}

async function applyUpvoteState(deals, userId) {
  const dealList = deals || [];
  const ids = dealList.map((deal) => deal.id).filter(Boolean);
  if (ids.length === 0) return dealList.map(withDefaultUpvoteState);

  let upvotedIds = new Set();
  if (userId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("deal_id")
      .eq("user_id", userId)
      .in("deal_id", ids);
    if (!error) {
      upvotedIds = new Set((data || []).map((row) => row.deal_id));
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

async function getExistingUpvote(userId, dealId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("deal_id", dealId)
    .maybeSingle();
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
  const { data, error } = await supabaseAdmin
    .from(DEALS_TABLE)
    .select("upvote_count")
    .eq("id", dealId)
    .maybeSingle();
  throwIfSupabaseError(error, DEALS_TABLE);
  return Number(data?.upvote_count || 0);
}

async function setDealUpvoteCount(dealId, delta) {
  const current = await getDealUpvoteCount(dealId);
  const next = Math.max(0, current + delta);
  const { data, error } = await supabaseAdmin
    .from(DEALS_TABLE)
    .update({ upvote_count: next })
    .eq("id", dealId)
    .select("upvote_count")
    .single();
  throwIfSupabaseError(error, DEALS_TABLE);
  return Number(data?.upvote_count ?? next);
}

function toApiUpvotedDeal(row) {
  return {
    id: row.id,
    userId: row.user_id,
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

function responsePayload(message, upvoted, count) {
  return {
    success: true,
    message,
    upvoted,
    upvote_count: Number(count || 0)
  };
}

function requireUserId(userId) {
  if (!userId) {
    const error = new Error("userId is required.");
    error.statusCode = 400;
    throw error;
  }
}

function requireDealId(dealId) {
  if (!dealId) {
    const error = new Error("dealId is required.");
    error.statusCode = 400;
    throw error;
  }
}

module.exports = {
  applyUpvoteState,
  getUpvotedDeals,
  removeUpvote,
  upvoteDeal
};
