const { supabaseAdmin } = require("../config/supabaseClient");
const { toApiDeal } = require("../mappers/dealMapper");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");
const { detectPlatform } = require("../../lib/platformDetector");
const { normalizeUrl } = require("../../lib/urlUtils");

async function trackProductPrice(productUrl, userId = null) {
  const normalizedUrl = normalizeUrl(productUrl);
  if (!normalizedUrl) {
    const error = new Error("A valid productUrl is required.");
    error.statusCode = 400;
    throw error;
  }

  const storeName = detectStoreName(normalizedUrl);
  const platformProductId = extractPlatformProductId(normalizedUrl, storeName);
  const trackedProduct = await findTrackedProduct(normalizedUrl, platformProductId, storeName);
  const deal = await findExistingDeal(normalizedUrl, platformProductId, storeName);
  const history = await findPriceHistory({
    dealId: deal?.id || trackedProduct?.deal_id || null,
    productUrl: normalizedUrl,
    platformProductId,
    storeName
  });

  if (!trackedProduct && !deal && history.length === 0) {
    await saveTrackingRequest({ productUrl, normalizedUrl, storeName, platformProductId, userId });
    return {
      success: true,
      trackingStarted: true,
      storeName,
      productUrl: normalizedUrl,
      title: "",
      imageUrl: "",
      currentPrice: null,
      lowestPrice: null,
      highestPrice: null,
      averagePrice: null,
      currency: "INR",
      priceHistory: [],
      bestDeal: null,
      message: "Tracking started. Price data will appear after the next fetch."
    };
  }

  const dealApi = deal ? toApiDeal(deal) : null;
  const historyPrices = history
    .map((point) => Number(point.price))
    .filter((price) => Number.isFinite(price) && price >= 0);
  const currentPrice = firstNumeric(
    trackedProduct?.current_price,
    dealApi?.dealPrice,
    dealApi?.currentPrice,
    latestHistoryPrice(history)
  );
  const lowestPrice = firstNumeric(
    trackedProduct?.lowest_price,
    historyPrices.length ? Math.min(...historyPrices) : null,
    dealApi?.lowestPrice,
    currentPrice
  );
  const highestPrice = firstNumeric(
    trackedProduct?.highest_price,
    historyPrices.length ? Math.max(...historyPrices) : null,
    dealApi?.highestPrice,
    currentPrice
  );
  const averagePrice = firstNumeric(
    trackedProduct?.average_price,
    historyPrices.length ? Math.round(historyPrices.reduce((sum, price) => sum + price, 0) / historyPrices.length) : null,
    dealApi?.averagePrice,
    currentPrice
  );
  const bestDeal = await findBestDeal({ title: dealApi?.title || trackedProduct?.title || "", storeName, productUrl: normalizedUrl, currentPrice });

  return {
    success: true,
    storeName: trackedProduct?.store_name || dealApi?.storeName || storeName,
    productUrl: trackedProduct?.product_url || dealApi?.productUrl || normalizedUrl,
    title: trackedProduct?.title || dealApi?.title || "",
    imageUrl: trackedProduct?.image_url || dealApi?.imageUrl || "",
    currentPrice,
    lowestPrice,
    highestPrice,
    averagePrice,
    currency: trackedProduct?.currency || dealApi?.currency || "INR",
    priceHistory: history.map((point) => ({
      price: Number(point.price),
      checkedAt: point.checked_at || point.recorded_at || point.created_at,
      storeName: point.store_name || point.platform || storeName,
      source: point.source || "telegram/backend"
    })),
    bestDeal
  };
}

async function findTrackedProduct(normalizedUrl, platformProductId, storeName) {
  const filters = [
    ["normalized_url", normalizedUrl],
    ["product_url", normalizedUrl],
    platformProductId ? ["platform_product_id", platformProductId] : null
  ].filter(Boolean);

  for (const [column, value] of filters) {
    const { data, error } = await supabaseAdmin
      .from("tracked_products")
      .select("*")
      .eq(column, value)
      .maybeSingle();
    if (isMissingTable(error)) return null;
    throwIfSupabaseError(error, "tracked_products");
    if (data && (!storeName || !data.store_name || sameKey(data.store_name, storeName))) return data;
  }
  return null;
}

async function findExistingDeal(normalizedUrl, platformProductId, storeName) {
  const selectors = [
    ["source_url", normalizedUrl],
    ["affiliate_link", normalizedUrl],
    ["platform_product_url", normalizedUrl],
    platformProductId ? ["source_product_id", platformProductId] : null
  ].filter(Boolean);

  for (const [column, value] of selectors) {
    const { data, error } = await supabaseAdmin
      .from("deals")
      .select("*, categories(*), stores(*)")
      .eq(column, value)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (isMissingColumn(error)) continue;
    throwIfSupabaseError(error, "deals");
    const row = (data || []).find((deal) => !storeName || sameKey(deal.stores?.name || deal.store_name || "", storeName)) || data?.[0];
    if (row) return row;
  }
  return null;
}

async function findPriceHistory({ dealId, productUrl, platformProductId, storeName }) {
  const rows = new Map();
  const selectors = [
    dealId ? ["deal_id", dealId] : null,
    ["product_url", productUrl],
    ["product_url", normalizeUrl(productUrl)],
    platformProductId ? ["platform_product_id", platformProductId] : null
  ].filter(Boolean);

  for (const [column, value] of selectors) {
    const { data, error } = await supabaseAdmin
      .from("price_history")
      .select("*")
      .eq(column, value)
      .order("checked_at", { ascending: true });
    if (isMissingColumn(error)) continue;
    throwIfSupabaseError(error, "price_history");
    for (const row of data || []) {
      if (storeName && row.store_name && !sameKey(row.store_name, storeName)) continue;
      rows.set(row.id || `${row.price}-${row.checked_at || row.recorded_at}`, row);
    }
  }

  return [...rows.values()].sort((a, b) =>
    new Date(a.checked_at || a.recorded_at || a.created_at || 0).getTime() -
    new Date(b.checked_at || b.recorded_at || b.created_at || 0).getTime()
  );
}

async function saveTrackingRequest({ productUrl, normalizedUrl, storeName, platformProductId, userId }) {
  const payload = {
    product_url: productUrl,
    normalized_url: normalizedUrl,
    store_name: storeName,
    platform_product_id: platformProductId || null,
    user_id: userId || null,
    status: "pending",
    updated_at: new Date().toISOString()
  };
  const { error } = await supabaseAdmin
    .from("price_tracking_requests")
    .insert(payload);
  if (isMissingTable(error) || isMissingColumn(error)) return;
  if (/duplicate key/i.test(error?.message || "")) return;
  throwIfSupabaseError(error, "price_tracking_requests");
}

async function findBestDeal({ title, storeName, productUrl, currentPrice }) {
  let query = supabaseAdmin
    .from("deals")
    .select("*, categories(*), stores(*)")
    .eq("status", "active")
    .gte("discounted_price", 0)
    .or(`platform_expires_at.is.null,platform_expires_at.gt.${new Date().toISOString()}`)
    .order("discounted_price", { ascending: true })
    .limit(12);

  const search = searchableTitle(title);
  if (search) {
    query = query.ilike("title", `%${escapeIlike(search)}%`);
  }

  const { data, error } = await query;
  if (isMissingColumn(error)) return null;
  throwIfSupabaseError(error, "deals");
  const deal = (data || [])
    .map(toApiDeal)
    .filter((item) => item.isValid && !item.isExpired)
    .filter((item) => item.productUrl !== productUrl)
    .filter((item) => Number(item.dealPrice || item.currentPrice || 0) > 0)
    .find((item) => !currentPrice || Number(item.dealPrice || item.currentPrice) <= Number(currentPrice));

  if (!deal) return null;
  return {
    storeName: deal.storeName || storeName,
    dealPrice: Number(deal.dealPrice || deal.currentPrice || 0),
    productUrl: deal.productUrl || deal.dealUrl || ""
  };
}

function detectStoreName(productUrl) {
  return detectPlatform(productUrl) || "Telegram";
}

function extractPlatformProductId(productUrl, storeName) {
  try {
    const parsed = new URL(productUrl);
    const path = decodeURIComponent(parsed.pathname);
    const storeKey = key(storeName);
    if (storeKey === "amazon") {
      return path.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1]?.toUpperCase() || "";
    }
    if (storeKey === "flipkart") {
      return path.match(/\/(itm[a-z0-9]+)/i)?.[1] || parsed.searchParams.get("pid") || "";
    }
    if (storeKey === "myntra") {
      return path.match(/\/(\d+)(?:\/|$)/)?.[1] || "";
    }
    if (["ajio", "croma", "tatacliq", "nykaa", "meesho", "shopsy", "snapdeal"].includes(storeKey)) {
      return path.match(/(?:\/p\/|\/p-|\/)([a-z0-9_-]{6,})(?:[/?]|$)/i)?.[1] || "";
    }
    return "";
  } catch {
    return "";
  }
}

function firstNumeric(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric >= 0) return numeric;
  }
  return null;
}

function latestHistoryPrice(history) {
  const point = history.slice().reverse().find((item) => Number(item.price) >= 0);
  return point ? Number(point.price) : null;
}

function searchableTitle(title) {
  return String(title || "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !/^(the|and|for|with|deal|offer|price)$/i.test(word))
    .slice(0, 3)
    .join(" ");
}

function escapeIlike(value) {
  return String(value || "").replace(/[%_]/g, "\\$&");
}

function sameKey(a, b) {
  return key(a) === key(b);
}

function key(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isMissingTable(error) {
  return /relation .* does not exist|schema cache/i.test(error?.message || "");
}

function isMissingColumn(error) {
  return /column .* does not exist|could not find .* column|schema cache/i.test(error?.message || "");
}

module.exports = { extractPlatformProductId, trackProductPrice };
