const { supabaseAdmin } = require("../config/supabaseClient");
const { isAutomatedScrapedDeal, toApiDeal } = require("../mappers/dealMapper");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "deal_watchlist";

async function createPriceAlert(payload) {
  const userId = payload.userId || payload.user_id;
  const dealId = payload.dealId || payload.deal_id;
  const targetPrice = payload.targetPrice ?? payload.target_price;

  if (!userId || !dealId || targetPrice === undefined) {
    const error = new Error("userId, dealId, and targetPrice are required.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await findAlert(userId, dealId);
  const query = existing
    ? supabaseAdmin
      .from(TABLE)
      .update({ target_price: Number(targetPrice) })
      .eq("id", existing.id)
    : supabaseAdmin
      .from(TABLE)
      .insert({
        user_id: userId,
        deal_id: dealId,
        target_price: Number(targetPrice)
      });

  const { data, error } = await query
    .select("*, deals(*, categories(*), stores(*))")
    .single();
  throwIfSupabaseError(error, TABLE);
  return toApiPriceAlert(data);
}

async function removePriceAlert(userId, dealId) {
  if (!userId || !dealId) {
    const error = new Error("userId and dealId are required.");
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ target_price: null })
    .eq("user_id", userId)
    .eq("deal_id", dealId)
    .select("*, deals(*, categories(*), stores(*))")
    .maybeSingle();
  throwIfSupabaseError(error, TABLE);

  return data && isAutomatedScrapedDeal(data.deals)
    ? toApiPriceAlert(data)
    : { userId, dealId, targetPrice: null, alertStatus: "removed" };
}

async function findAlert(userId, dealId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("deal_id", dealId)
    .maybeSingle();
  throwIfSupabaseError(error, TABLE);
  return data;
}

function toApiPriceAlert(row) {
  return {
    id: row.id,
    userId: row.user_id,
    dealId: row.deal_id,
    targetPrice: row.target_price,
    alertStatus: row.target_price === null || row.target_price === undefined ? "watching" : "active",
    notificationSent: false,
    createdAt: row.created_at,
    deal: row.deals ? toApiDeal(row.deals) : null
  };
}

module.exports = { createPriceAlert, removePriceAlert };
