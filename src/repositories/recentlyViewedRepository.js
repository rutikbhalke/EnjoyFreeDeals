const { supabaseAdmin } = require("../config/supabaseClient");
const { isAutomatedScrapedDeal, toApiDeal } = require("../mappers/dealMapper");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "recently_viewed_deals";

async function recordRecentlyViewed(payload) {
  const userId = payload.userId || payload.user_id;
  const dealId = payload.dealId || payload.deal_id;

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
      viewed_at: new Date().toISOString()
    }, { onConflict: "user_id,deal_id" })
    .select("*, deals(*, categories(*), stores(*))")
    .single();
  throwIfSupabaseError(error, TABLE);
  return toApiRecentlyViewed(data);
}

async function getRecentlyViewed(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, deals(*, categories(*), stores(*))")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false });
  throwIfSupabaseError(error, TABLE);
  return (data || [])
    .filter((row) => isAutomatedScrapedDeal(row.deals))
    .map(toApiRecentlyViewed);
}

function toApiRecentlyViewed(row) {
  return {
    id: row.id,
    userId: row.user_id,
    dealId: row.deal_id,
    viewedAt: row.viewed_at,
    deal: row.deals ? toApiDeal(row.deals) : null
  };
}

module.exports = { getRecentlyViewed, recordRecentlyViewed };
