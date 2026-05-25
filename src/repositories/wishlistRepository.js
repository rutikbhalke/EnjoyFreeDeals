const { supabaseAdmin } = require("../config/supabaseClient");
const { isAutomatedScrapedDeal, toApiDeal } = require("../mappers/dealMapper");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "deal_watchlist";

async function addToWishlist(payload) {
  const userId = payload.userId || payload.user_id;
  const dealId = payload.dealId || payload.deal_id;

  if (!userId || !dealId) {
    const error = new Error("userId and dealId are required.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await findWatchlistItem(userId, dealId);
  if (existing) {
    return toApiWatchlistItem(existing);
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      user_id: userId,
      deal_id: dealId,
      target_price: payload.targetPrice ?? payload.target_price ?? null
    })
    .select("*, deals(*, categories(*), stores(*))")
    .single();
  throwIfSupabaseError(error, TABLE);
  return toApiWatchlistItem(data);
}

async function getWishlist(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, deals(*, categories(*), stores(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  throwIfSupabaseError(error, TABLE);
  return (data || [])
    .filter((row) => isAutomatedScrapedDeal(row.deals))
    .map(toApiWatchlistItem);
}

async function removeFromWishlist(userId, dealId) {
  if (!userId || !dealId) {
    const error = new Error("userId and dealId are required.");
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("deal_id", dealId)
    .select("*");
  throwIfSupabaseError(error, TABLE);
  return { removed: (data || []).length > 0, userId, dealId };
}

async function findWatchlistItem(userId, dealId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, deals(*, categories(*), stores(*))")
    .eq("user_id", userId)
    .eq("deal_id", dealId)
    .maybeSingle();
  throwIfSupabaseError(error, TABLE);
  return data && isAutomatedScrapedDeal(data.deals) ? data : null;
}

function toApiWatchlistItem(row) {
  return {
    id: row.id,
    userId: row.user_id,
    dealId: row.deal_id,
    targetPrice: row.target_price,
    createdAt: row.created_at,
    deal: row.deals ? toApiDeal(row.deals) : null
  };
}

module.exports = { addToWishlist, getWishlist, removeFromWishlist };
