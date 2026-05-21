const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "price_history";

async function listPriceHistory(dealId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("deal_id", dealId)
    .order("recorded_at", { ascending: true });
  throwIfSupabaseError(error, TABLE);
  return (data || []).map(toApiPricePoint);
}

function toApiPricePoint(row) {
  return {
    id: row.id,
    dealId: row.deal_id,
    productId: row.deal_id,
    price: Number(row.price || 0),
    priceAmount: Number(row.price || 0),
    currentPrice: Number(row.price || 0),
    recordedAt: row.recorded_at,
    checkedAt: row.recorded_at,
    priceCheckedAt: row.recorded_at,
    createdAt: row.recorded_at,
    updatedAt: row.recorded_at,
    source: "supabase"
  };
}

module.exports = { listPriceHistory };
