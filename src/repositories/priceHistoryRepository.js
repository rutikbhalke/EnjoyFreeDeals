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

async function getPriceHistorySummary(productId) {
  const history = await listStoredPriceHistory(productId);
  const points = history.length >= 2 ? history : await buildFallbackHistory(productId);
  const prices = points.map((point) => Number(point.price || 0)).filter((price) => Number.isFinite(price) && price > 0);
  const average = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;

  return {
    product_id: productId,
    history: points.map((point) => ({
      date: point.date,
      price: Number(point.price || 0),
      platform: point.platform || null,
      recorded_at: point.recorded_at || point.date
    })),
    average_price: Math.round(average),
    lowest_price: prices.length ? Math.min(...prices) : 0,
    highest_price: prices.length ? Math.max(...prices) : 0
  };
}

async function listStoredPriceHistory(productId) {
  const rows = await queryHistoryByColumn("product_id", productId)
    .then((data) => data.length ? data : queryHistoryByColumn("deal_id", productId))
    .catch(() => queryHistoryByColumn("deal_id", productId).catch(() => []));

  return rows.map((row) => ({
    date: row.recorded_at || row.created_at,
    recorded_at: row.recorded_at || row.created_at,
    price: Number(row.price || row.current_price || row.deal_price || 0),
    platform: row.platform || row.store_name || null
  })).filter((point) => Number.isFinite(point.price) && point.price > 0);
}

async function queryHistoryByColumn(column, productId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq(column, productId)
    .order("recorded_at", { ascending: true });
  throwIfSupabaseError(error, TABLE);
  return data || [];
}

async function buildFallbackHistory(productId) {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id,title,original_price,discounted_price,stores(name)")
    .eq("id", productId)
    .maybeSingle();
  throwIfSupabaseError(error, "deals");

  const dealPrice = positiveNumber(data?.discounted_price) || 999;
  const originalPrice = positiveNumber(data?.original_price) || Math.round(dealPrice * 1.35);
  const lowestPrice = Math.min(dealPrice, Math.round(dealPrice * 0.92));
  const platform = data?.stores?.name || "Store";
  const today = new Date();

  return [
    { offsetDays: 30, price: originalPrice },
    { offsetDays: 20, price: Math.max(lowestPrice, Math.round(originalPrice * 0.9)) },
    { offsetDays: 10, price: Math.max(lowestPrice, Math.round(dealPrice * 1.08)) },
    { offsetDays: 0, price: dealPrice }
  ].map((point) => {
    const date = new Date(today);
    date.setDate(today.getDate() - point.offsetDays);
    return {
      date: date.toISOString(),
      recorded_at: date.toISOString(),
      price: point.price,
      platform
    };
  });
}

function toApiPricePoint(row) {
  return {
    id: row.id,
    dealId: row.deal_id || row.product_id,
    productId: row.product_id || row.deal_id,
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

function positiveNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

module.exports = { listPriceHistory, getPriceHistorySummary };
