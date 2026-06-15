const { supabaseAdmin } = require("../config/supabaseClient");
const { toApiDeal } = require("../mappers/dealMapper");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");
const { detectPlatform } = require("../../lib/platformDetector");
const { buildSearchUrl, normalizeUrl } = require("../../lib/urlUtils");
const { getPlatformLogo } = require("../../lib/platformLogos");
const { fetchProductMetadata } = require("../services/dealDetailEnricher");

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
  const comparison = await findComparison({
    dealId: deal?.id || trackedProduct?.deal_id || null,
    normalizedUrl,
    productTitle: deal?.title || trackedProduct?.title || ""
  });
  const relatedDeals = await findRelatedDeals({
    categoryId: deal?.category_id || null,
    storeId: deal?.store_id || null,
    excludeDealId: deal?.id || trackedProduct?.deal_id || null,
    excludeUrl: normalizedUrl
  });

  if (!trackedProduct && !deal && history.length === 0) {
    await saveTrackingRequest({ productUrl, normalizedUrl, storeName, platformProductId, userId });
    const liveSummary = await tryBuildLiveTrackingSummary({ normalizedUrl, storeName, platformProductId });
    if (liveSummary) return liveSummary;

    return {
      success: true,
      status: "tracking_started",
      dealId: null,
      trackingStarted: true,
      storeName,
      productUrl: normalizedUrl,
      title: null,
      imageUrl: null,
      originalPrice: null,
      currentPrice: null,
      lowestPrice: null,
      highestPrice: null,
      averagePrice: null,
      thirtyDayAverage: null,
      currency: "INR",
      lastCheckedAt: null,
      historyDays: null,
      dealScore: null,
      isAllTimeLow: false,
      recommendation: {
        label: "Not enough data",
        reason: "Price history will appear after more tracking data is collected."
      },
      priceHistory: [],
      storeComparisons: [],
      relatedDeals: [],
      images: [],
      bestDeal: null,
      message: "Tracking started. Price data will appear after the next fetch."
    };
  }

  const dealApi = deal ? toApiDeal(deal) : null;
  const summary = buildTrackingSummary({
    trackedProduct,
    dealApi,
    history,
    comparison,
    relatedDeals,
    normalizedUrl,
    storeName
  });

  return {
    success: true,
    storeName: summary.storeName,
    productUrl: summary.productUrl,
    title: summary.title,
    description: summary.description,
    imageUrl: summary.imageUrl,
    images: summary.images,
    categoryName: summary.categoryName,
    currentPrice: summary.currentPrice,
    originalPrice: summary.originalPrice,
    discountPercent: summary.discountPercent,
    youSave: summary.youSave,
    lowestPrice: summary.lowestPrice,
    highestPrice: summary.highestPrice,
    averagePrice: summary.averagePrice,
    thirtyDayAverage: summary.thirtyDayAverage,
    currency: summary.currency,
    lastCheckedAt: summary.lastCheckedAt,
    historyDays: summary.historyDays,
    dealScore: summary.dealScore,
    isAllTimeLow: summary.isAllTimeLow,
    recommendation: summary.recommendation,
    priceHistory: summary.priceHistory,
    storeComparisons: summary.storeComparisons,
    relatedDeals: summary.relatedDeals,
    bestDeal: summary.bestDeal,
    dealId: summary.dealId
  };
}

async function tryBuildLiveTrackingSummary({ normalizedUrl, storeName, platformProductId }) {
  try {
    const metadata = await fetchProductMetadata(normalizedUrl, { timeoutMs: 12000 });
    const metadataTitle = cleanText(metadata.title);
    const title = isBadLiveTitle(metadataTitle) ? titleFromProductUrl(normalizedUrl) : metadataTitle;
    const productUrl = normalizeUrl(metadata.finalUrl || normalizedUrl) || normalizedUrl;
    const currentPrice = firstNumeric(metadata.discountedPrice);
    const originalPrice = firstNumeric(metadata.originalPrice);
    const imageUrl = normalizeUrl(metadata.imageUrl) || metadata.imageUrl || "";

    if (!title && !imageUrl && currentPrice == null) return null;

    const relatedDeals = title
      ? await findLiveRelatedDeals({ title, storeName, productUrl })
      : [];
    const storeComparisons = buildLiveStoreComparisons({
      storeName,
      currentPrice,
      productUrl,
      relatedDeals,
      title
    });
    const priceHistory = currentPrice != null
      ? [{ price: currentPrice, checkedAt: new Date().toISOString(), storeName, source: "live-product-page" }]
      : [];
    const comparisonPrices = storeComparisons.map((item) => item.price).filter((price) => Number.isFinite(price) && price > 0);
    const allPrices = [...priceHistory.map((point) => point.price), ...comparisonPrices];
    const lowestPrice = allPrices.length ? Math.min(...allPrices) : currentPrice;
    const highestPrice = allPrices.length ? Math.max(...allPrices) : firstNumeric(originalPrice, currentPrice);
    const averagePrice = allPrices.length
      ? Math.round(allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length)
      : currentPrice;
    const discountPercent = safePercent(null, originalPrice, currentPrice);

    return {
      success: true,
      status: "live_result",
      trackingStarted: false,
      dealId: null,
      storeName,
      productUrl,
      title: title || `${storeName} product`,
      description: metadata.description || "",
      imageUrl,
      images: uniqueStrings([imageUrl]),
      categoryName: inferCategoryName(`${title} ${storeName}`),
      currentPrice: currentPrice ?? null,
      originalPrice: originalPrice ?? null,
      discountPercent,
      youSave: originalPrice && currentPrice != null && originalPrice > currentPrice ? Math.round(originalPrice - currentPrice) : null,
      lowestPrice: lowestPrice ?? null,
      highestPrice: highestPrice ?? null,
      averagePrice: averagePrice ?? null,
      thirtyDayAverage: null,
      currency: "INR",
      lastCheckedAt: new Date().toISOString(),
      historyDays: priceHistory.length ? 1 : 0,
      dealScore: null,
      isAllTimeLow: currentPrice != null && lowestPrice != null ? currentPrice <= lowestPrice : false,
      recommendation: buildRecommendation({ currentPrice, lowestPrice, averagePrice, priceHistory }),
      priceHistory,
      storeComparisons,
      relatedDeals,
      bestDeal: storeComparisons.find((item) => item.isBest) || null,
      platformProductId: platformProductId || null,
      message: "Live product details loaded. More price history will appear after future checks."
    };
  } catch (error) {
    console.warn("[track-price] live product metadata skipped:", error.message || error);
    return null;
  }
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

async function findComparison({ dealId, normalizedUrl, productTitle }) {
  const selectors = [
    dealId ? ["deal_id", dealId] : null,
    normalizedUrl ? ["product_url", normalizedUrl] : null,
    productTitle ? ["product_name", productTitle] : null
  ].filter(Boolean);

  for (const [column, value] of selectors) {
    const { data, error } = await supabaseAdmin
      .from("price_comparisons")
      .select("*, price_comparison_platforms(*)")
      .eq(column, value)
      .order("last_updated", { ascending: false })
      .maybeSingle();
    if (isMissingTable(error)) return null;
    if (isMissingColumn(error)) continue;
    throwIfSupabaseError(error, "price_comparisons");
    if (data) return data;
  }

  return null;
}

async function findRelatedDeals({ categoryId, storeId, excludeDealId, excludeUrl }) {
  const sources = [];
  if (categoryId) sources.push(queryRelatedDeals().eq("category_id", categoryId).limit(6));
  if (storeId) sources.push(queryRelatedDeals().eq("store_id", storeId).limit(6));
  if (!sources.length) return [];

  const results = [];
  for (const query of sources) {
    const { data, error } = await query;
    if (isMissingColumn(error)) continue;
    throwIfSupabaseError(error, "deals");
    results.push(...(data || []));
  }

  const seen = new Set();
  return results
    .filter((row) => row && row.id !== excludeDealId)
    .filter((row) => {
      const url = normalizeUrl(row.affiliate_link || row.source_url || row.platform_product_url || "");
      if (excludeUrl && url === excludeUrl) return false;
      const key = `${row.id || ""}:${url || row.slug || row.title || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(toApiDeal)
    .filter((deal) => deal.isValid && !deal.isExpired)
    .slice(0, 6);
}

async function findLiveRelatedDeals({ title, storeName, productUrl }) {
  const terms = cleanText(title)
    .split(/\s+/)
    .filter((term) => term.length > 2 && !/^(with|for|and|the|cover|case)$/i.test(term))
    .slice(0, 5);
  const search = terms.join(" ");
  if (!search) return [];

  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("*, categories(*), stores(*)")
    .or(`title.ilike.%${escapeLike(search)}%,description.ilike.%${escapeLike(search)}%`)
    .or(`status.eq.active,status.eq.approved,status.is.null`)
    .gte("discounted_price", 0)
    .or(`platform_expires_at.is.null,platform_expires_at.gt.${new Date().toISOString()}`)
    .order("updated_at", { ascending: false })
    .limit(12);
  if (isMissingColumn(error)) return [];
  throwIfSupabaseError(error, "deals");

  const excludeUrl = normalizeUrl(productUrl);
  const seen = new Set();
  return (data || [])
    .filter((row) => {
      const rowStore = row.stores?.name || row.store_name || "";
      if (storeName && rowStore && sameKey(rowStore, storeName)) return false;
      const rowUrl = normalizeUrl(row.affiliate_link || row.source_url || row.platform_product_url || "");
      if (excludeUrl && rowUrl === excludeUrl) return false;
      const keyValue = row.id || rowUrl || row.title;
      if (seen.has(keyValue)) return false;
      seen.add(keyValue);
      return true;
    })
    .map(toApiDeal)
    .filter((deal) => deal.isValid && !deal.isExpired && Number(deal.dealPrice ?? deal.discountedPrice ?? 0) > 0)
    .slice(0, 6);
}

function buildLiveStoreComparisons({ storeName, currentPrice, productUrl, relatedDeals, title }) {
  const rows = [];
  if (currentPrice != null) {
    rows.push({
      storeName: storeName || "Store",
      price: currentPrice,
      productUrl,
      isBest: false,
      difference: 0,
      platformLogoUrl: getPlatformLogo(storeName)
    });
  }

  for (const deal of relatedDeals || []) {
    const price = Number(deal.dealPrice ?? deal.discountedPrice ?? deal.currentPrice ?? 0);
    const url = deal.productUrl || deal.dealUrl || deal.affiliateUrl || "";
    if (!Number.isFinite(price) || price <= 0 || !url) continue;
    rows.push({
      storeName: deal.storeName || "Store",
      price,
      productUrl: url,
      isBest: false,
      difference: 0,
      platformLogoUrl: getPlatformLogo(deal.storeName)
    });
  }

  const deduped = dedupeStoreComparisons(rows);
  const searchRows = ["Amazon", "Flipkart", "Meesho", "Myntra", "Ajio", "Croma", "TataCliq"]
    .filter((platform) => !deduped.some((row) => sameKey(row.storeName, platform)))
    .map((platform) => ({
      storeName: platform,
      price: null,
      productUrl: buildSearchUrl(platform, title),
      isBest: false,
      difference: 0,
      platformLogoUrl: getPlatformLogo(platform)
    }));
  const withSearchLinks = [...deduped, ...searchRows].slice(0, 7);
  const pricedRows = withSearchLinks.filter((item) => Number.isFinite(item.price) && item.price > 0);
  const lowest = pricedRows.reduce((min, item) => (min == null || item.price < min.price ? item : min), null);

  return withSearchLinks.map((item) => ({
    ...item,
    isBest: lowest ? item.storeName === lowest.storeName && item.price === lowest.price : false,
    difference: lowest && Number.isFinite(item.price) ? Math.max(0, Math.round(item.price - lowest.price)) : 0
  }));
}

function queryRelatedDeals() {
  return supabaseAdmin
    .from("deals")
    .select("*, categories(*), stores(*)")
    .eq("status", "active")
    .gte("discounted_price", 0)
    .or(`platform_expires_at.is.null,platform_expires_at.gt.${new Date().toISOString()}`)
    .in("raw_source_payload->>connectorMode", ["html-scrape", "telegram-bot", "telegram-page", "telegram-channel", "direct-platform-fetch"])
    .order("updated_at", { ascending: false });
}

function buildTrackingSummary({ trackedProduct, dealApi, history, comparison, relatedDeals, normalizedUrl, storeName }) {
  const priceHistory = history.map((point) => ({
    price: Number(point.price),
    checkedAt: point.checked_at || point.recorded_at || point.created_at || null,
    storeName: point.store_name || point.platform || storeName,
    source: point.source || "telegram/backend"
  })).filter((point) => Number.isFinite(point.price) && point.price >= 0);

  const historyPrices = priceHistory.map((point) => point.price).filter((price) => Number.isFinite(price) && price >= 0);
  const comparisonPrices = normalizeComparisonPrices(comparison, dealApi, trackedProduct, normalizedUrl, storeName);
  const allPrices = [...historyPrices, ...comparisonPrices.map((item) => item.price)].filter((price) => Number.isFinite(price) && price >= 0);
  const currentPrice = firstNumeric(
    trackedProduct?.current_price,
    dealApi?.dealPrice,
    dealApi?.currentPrice,
    latestHistoryPrice(priceHistory),
    comparisonPrices.find((item) => item.isBest)?.price,
    comparisonPrices[0]?.price
  );
  const lowestPrice = allPrices.length ? Math.min(...allPrices) : firstNumeric(trackedProduct?.lowest_price, currentPrice);
  const highestPrice = allPrices.length ? Math.max(...allPrices) : firstNumeric(trackedProduct?.highest_price, currentPrice);
  const averagePrice = allPrices.length ? Math.round(allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length) : firstNumeric(trackedProduct?.average_price, currentPrice);
  const thirtyDayPrices = priceHistory
    .filter((point) => point.checkedAt && new Date(point.checkedAt).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000)
    .map((point) => point.price);
  const thirtyDayAverage = thirtyDayPrices.length
    ? Math.round(thirtyDayPrices.reduce((sum, price) => sum + price, 0) / thirtyDayPrices.length)
    : null;
  const originalPrice = firstNumeric(trackedProduct?.original_price, dealApi?.originalPrice, comparison?.original_price, highestPrice, currentPrice);
  const discountPercent = safePercent(
    firstNumeric(trackedProduct?.discount_percent, dealApi?.discountPercent, comparison?.discount_percentage),
    originalPrice,
    currentPrice
  );
  const youSave = originalPrice && currentPrice != null && originalPrice > currentPrice ? Math.round(originalPrice - currentPrice) : null;
  const historyDays = new Set(priceHistory.map((point) => (point.checkedAt ? new Date(point.checkedAt).toISOString().slice(0, 10) : "")).filter(Boolean)).size;
  const currency = trackedProduct?.currency || dealApi?.currency || "INR";
  const lastCheckedAt = lastCheckedAtValue(priceHistory, comparison?.last_updated || trackedProduct?.updated_at || dealApi?.lastCheckedAt || null);
  const isAllTimeLow = Number.isFinite(currentPrice) && Number.isFinite(lowestPrice) ? Number(currentPrice) <= Number(lowestPrice) : false;
  const recommendation = buildRecommendation({ currentPrice, lowestPrice, averagePrice, priceHistory });
  const dealScore = buildDealScore({ currentPrice, lowestPrice, averagePrice, discountPercent, priceHistory });
  const images = uniqueStrings([
    trackedProduct?.image_url,
    dealApi?.imageUrl,
    comparison?.image_url,
    dealApi?.sourceImageUrl
  ]);
  const title = trackedProduct?.title || dealApi?.title || comparison?.product_name || "";
  const description = dealApi?.description || "";
  const categoryName = dealApi?.categoryName || comparison?.category || "Other Deals";
  const storeComparisons = comparisonPrices.length ? comparisonPrices : singleStoreComparison({
    storeName: trackedProduct?.store_name || dealApi?.storeName || storeName,
    price: currentPrice,
    productUrl: trackedProduct?.product_url || dealApi?.productUrl || normalizedUrl
  });

  const bestDeal = storeComparisons.find((item) => item.isBest) || null;

  return {
    storeName: trackedProduct?.store_name || dealApi?.storeName || storeName,
    productUrl: trackedProduct?.product_url || dealApi?.productUrl || normalizedUrl,
    title,
    description,
    imageUrl: images[0] || "",
    images,
    categoryName,
    currentPrice: currentPrice ?? null,
    originalPrice: originalPrice ?? null,
    discountPercent: discountPercent ?? null,
    youSave,
    lowestPrice: lowestPrice ?? null,
    highestPrice: highestPrice ?? null,
    averagePrice: averagePrice ?? null,
    thirtyDayAverage,
    currency,
    lastCheckedAt,
    historyDays,
    dealScore,
    isAllTimeLow,
    recommendation,
    priceHistory,
    storeComparisons,
    relatedDeals,
    bestDeal,
    dealId: trackedProduct?.deal_id || dealApi?.dealId || comparison?.deal_id || null
  };
}

function normalizeComparisonPrices(comparison, dealApi, trackedProduct, normalizedUrl, storeName) {
  const rows = Array.isArray(comparison?.price_comparison_platforms) ? comparison.price_comparison_platforms : [];
  const mapped = rows
    .map((row) => ({
      storeName: row.platform || row.store_name || "Store",
      price: Number(row.price || 0),
      productUrl: row.product_url || row.affiliate_url || normalizedUrl,
      isBest: Boolean(row.is_lowest_price),
      difference: 0,
      platformLogoUrl: row.platform_logo_url || null
    }))
    .filter((item) => Number.isFinite(item.price) && item.price >= 0);
  if (!mapped.length && (dealApi?.dealPrice || trackedProduct?.current_price)) {
    return singleStoreComparison({
      storeName: trackedProduct?.store_name || dealApi?.storeName || storeName,
      price: firstNumeric(trackedProduct?.current_price, dealApi?.dealPrice, dealApi?.currentPrice),
      productUrl: trackedProduct?.product_url || dealApi?.productUrl || normalizedUrl
    });
  }
  const lowest = mapped.reduce((min, item) => (min == null || item.price < min.price ? item : min), null);
  return dedupeStoreComparisons(mapped).map((item) => ({
    ...item,
    isBest: lowest ? item.storeName === lowest.storeName && item.price === lowest.price : false,
    difference: lowest ? Math.max(0, Math.round(item.price - lowest.price)) : 0
  }));
}

function singleStoreComparison({ storeName, price, productUrl }) {
  if (!Number.isFinite(price)) return [];
  return [{
    storeName: storeName || "Store",
    price,
    productUrl: productUrl || "",
    isBest: true,
    difference: 0,
    platformLogoUrl: null
  }];
}

function dedupeStoreComparisons(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${String(row.storeName || "").trim().toLowerCase()}::${String(row.productUrl || "").trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildRecommendation({ currentPrice, lowestPrice, averagePrice, priceHistory }) {
  if (!priceHistory || priceHistory.length < 2 || !Number.isFinite(currentPrice) || !Number.isFinite(lowestPrice)) {
    return {
      label: "Not enough data",
      reason: "Price history will appear after more tracking data is collected."
    };
  }

  if (currentPrice <= lowestPrice * 1.05) {
    return {
      label: "Good time to buy",
      reason: "Current price is close to all-time low."
    };
  }

  if (Number.isFinite(averagePrice) && currentPrice > averagePrice) {
    return {
      label: "Wait for price drop",
      reason: "Current price is above 30-day average."
    };
  }

  return {
    label: "Fair price",
    reason: "Price is within a normal range compared to recent history."
  };
}

function buildDealScore({ currentPrice, lowestPrice, averagePrice, discountPercent, priceHistory }) {
  if (!priceHistory || priceHistory.length < 2 || !Number.isFinite(currentPrice)) return null;
  let score = 50;
  if (Number.isFinite(discountPercent)) score += Math.min(25, Math.max(0, discountPercent / 4));
  if (Number.isFinite(lowestPrice) && lowestPrice > 0) {
    const ratio = currentPrice / lowestPrice;
    if (ratio <= 1.02) score += 20;
    else if (ratio <= 1.05) score += 12;
    else if (ratio > 1.2) score -= 10;
  }
  if (Number.isFinite(averagePrice) && averagePrice > 0) {
    const ratio = currentPrice / averagePrice;
    if (ratio <= 0.95) score += 10;
    else if (ratio > 1.15) score -= 10;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function safePercent(discountPercent, originalPrice, currentPrice) {
  if (Number.isFinite(discountPercent) && discountPercent >= 0 && discountPercent <= 100) return Math.round(discountPercent);
  if (Number.isFinite(originalPrice) && originalPrice > 0 && Number.isFinite(currentPrice) && currentPrice >= 0 && currentPrice <= originalPrice) {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
  return null;
}

function lastCheckedAtValue(history, fallback) {
  const latest = history
    .map((point) => point.checkedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];
  return latest ? new Date(latest).toISOString() : fallback || null;
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeLike(value) {
  return String(value || "").replace(/[\\%_]/g, (match) => `\\${match}`);
}

function inferCategoryName(text) {
  const value = String(text || "").toLowerCase();
  if (/laptop|notebook|macbook/.test(value)) return "Laptop";
  if (/phone|mobile|smartphone/.test(value)) return "Mobile";
  if (/flipkart|fkrt|flpkrt/.test(value)) return "Flipkart Deals";
  if (/amazon|amzn/.test(value)) return "Amazon Deals";
  if (/shirt|shoe|jeans|dress|fashion|bag|kurta|saree|cover|case/.test(value)) return "Fashion";
  if (/grocery|food|snack|tea|coffee/.test(value)) return "Grocery";
  if (/beauty|skin|makeup|cosmetic|cream|serum/.test(value)) return "Beauty";
  if (/appliance|mixer|grinder|washing|fridge|microwave|air conditioner/.test(value)) return "Appliances";
  if (/home|kitchen|storage|container|bottle|furniture/.test(value)) return "Home & Kitchen";
  if (/earbud|speaker|watch|camera|charger|tablet|headphone|tv/.test(value)) return "Electronics";
  return "Other Deals";
}

function isBadLiveTitle(value) {
  return /^(access denied|forbidden|not found|page not found|error|meesho|amazon|flipkart)$/i.test(cleanText(value));
}

function titleFromProductUrl(productUrl) {
  try {
    const parsed = new URL(productUrl);
    const parts = decodeURIComponent(parsed.pathname).split("/").filter(Boolean);
    const slug = parts.find((part) => part.length > 12 && !/^p$/i.test(part)) || parts[0] || "";
    return cleanText(slug.replace(/[-_]+/g, " ")).replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 140);
  } catch {
    return "";
  }
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
