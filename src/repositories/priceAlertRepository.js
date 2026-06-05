const { supabaseAdmin } = require("../config/supabaseClient");
const { isAutomatedScrapedDeal, toApiDeal } = require("../mappers/dealMapper");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "price_alerts";

async function createPriceAlert(payload) {
  const userId = payload.userId || payload.user_id;
  const dealId = payload.dealId || payload.deal_id;
  const targetPrice = payload.targetPrice ?? payload.target_price;

  if (!userId || !dealId || targetPrice === undefined) {
    const error = new Error("userId, dealId, and targetPrice are required.");
    error.statusCode = 400;
    throw error;
  }

  const deal = await getDealForAlert(dealId);
  const currentPrice = Number(deal?.discounted_price || 0);
  const safeTarget = Number(targetPrice);
  const triggered = currentPrice > 0 && currentPrice <= safeTarget;

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .upsert({
      user_id: userId,
      deal_id: dealId,
      target_price: safeTarget,
      current_price: currentPrice || null,
      is_active: true,
      is_triggered: triggered,
      triggered_at: triggered ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,deal_id" })
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
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("deal_id", dealId)
    .select("*, deals(*, categories(*), stores(*))")
    .maybeSingle();
  throwIfSupabaseError(error, TABLE);

  return data && isAutomatedScrapedDeal(data.deals)
    ? toApiPriceAlert(data)
    : { userId, dealId, targetPrice: null, alertStatus: "removed" };
}

async function getPriceAlerts(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, deals(*, categories(*), stores(*))")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  throwIfSupabaseError(error, TABLE);
  return (data || [])
    .filter((row) => isAutomatedScrapedDeal(row.deals))
    .map(toApiPriceAlert);
}

async function getDealForAlert(dealId) {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("discounted_price")
    .eq("id", dealId)
    .maybeSingle();
  throwIfSupabaseError(error, "deals");
  return data;
}

function toApiPriceAlert(row) {
  return {
    id: row.id,
    userId: row.user_id,
    dealId: row.deal_id,
    targetPrice: row.target_price,
    currentPrice: row.current_price,
    isActive: row.is_active,
    isTriggered: row.is_triggered,
    triggeredAt: row.triggered_at,
    alertStatus: row.is_active ? (row.is_triggered ? "triggered" : "active") : "removed",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deal: row.deals ? toApiDeal(row.deals) : null
  };
}

module.exports = { createPriceAlert, getPriceAlerts, removePriceAlert };
