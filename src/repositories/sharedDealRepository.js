const { supabaseAdmin } = require("../config/supabaseClient");
const { isAutomatedScrapedDeal, toApiDeal } = require("../mappers/dealMapper");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "shared_deals";

async function addSharedDeal(payload) {
  const userId = payload.userId || payload.user_id;
  const dealId = payload.dealId || payload.deal_id;
  const shareChannel = payload.shareChannel || payload.share_channel || "system";
  const recipient = payload.recipient || "";
  const message = payload.message || "";

  if (!userId || !dealId) {
    const error = new Error("userId and dealId are required.");
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .upsert({
      user_id: userId,
      deal_id: dealId,
      share_channel: shareChannel,
      recipient,
      message,
      shared_at: new Date().toISOString()
    }, { onConflict: "user_id,deal_id" })
    .select("*, deals(*, categories(*), stores(*))")
    .single();
  throwIfSupabaseError(error, TABLE);
  return toApiSharedDeal(data);
}

async function getSharedDeals(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, deals(*, categories(*), stores(*))")
    .eq("user_id", userId)
    .order("shared_at", { ascending: false });
  throwIfSupabaseError(error, TABLE);
  return (data || [])
    .filter((row) => isAutomatedScrapedDeal(row.deals))
    .map(toApiSharedDeal);
}

function toApiSharedDeal(row) {
  return {
    id: row.id,
    userId: row.user_id,
    dealId: row.deal_id,
    shareChannel: row.share_channel || "system",
    recipient: row.recipient || "",
    message: row.message || "",
    sharedAt: row.shared_at || row.created_at,
    createdAt: row.created_at,
    deal: row.deals ? toApiDeal(row.deals) : null
  };
}

module.exports = { addSharedDeal, getSharedDeals };
