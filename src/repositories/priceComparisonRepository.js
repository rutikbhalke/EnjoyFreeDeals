const { supabaseAdmin } = require("../config/supabaseClient");
const { isMissingTableError, throwIfSupabaseError } = require("../utils/supabaseErrors");
const { getPlatformLogo } = require("../../lib/platformLogos");
const { normalizePlatformName, isSupportedPlatform } = require("../../lib/platformDetector");

const TABLE = "price_comparisons";
const PLATFORM_TABLE = "price_comparison_platforms";

async function listPriceComparisons() {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, price_comparison_platforms(*)")
    .order("last_updated", { ascending: false });
  if (isMissingTableError(error)) {
    return listDealBackedComparisons();
  }
  throwIfSupabaseError(error, TABLE);
  return (data || [])
    .map(toApiPriceComparison)
    .filter((comparison) => comparison.ecommercePlatformPrices.length > 0);
}

async function getPriceComparison(productId) {
  const deal = await findDeal(productId);
  if (!isUuid(productId)) {
    return toDemoPriceComparison(productId, deal);
  }
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, price_comparison_platforms(*)")
    .or(`id.eq.${productId},deal_id.eq.${productId}`)
    .maybeSingle();
  if (isMissingTableError(error)) {
    return deal ? toDealBackedPriceComparison(deal) : null;
  }
  throwIfSupabaseError(error, TABLE);
  if (!data) {
    return deal ? withDemoRows(toDealBackedPriceComparison(deal)) : toDemoPriceComparison(productId, deal);
  }
  const comparison = normalizeLowestFlags(toApiPriceComparison({ ...data, deal }));
  return comparison.ecommercePlatformPrices.length
    ? comparison
    : withDemoRows(comparison);
}

async function getPriceComparisonSummary(productId) {
  const comparison = await getPriceComparison(productId);
  if (!comparison) return null;
  return toComparePriceResponse(comparison);
}

async function savePriceComparison(productId, prices = []) {
  const normalizedPrices = normalizeInputPrices(prices);
  if (!productId || !normalizedPrices.length) {
    const error = new Error("product_id and at least one price are required");
    error.statusCode = 400;
    throw error;
  }

  const deal = await findDeal(productId);
  const productName = deal?.title || "Product";
  const imageUrl = deal?.final_image_url || deal?.image_url || deal?.source_image_url || "";
  const category = deal?.categories?.name || deal?.category_name || "";
  const originalPrice = firstNumber(deal?.original_price, normalizedPrices[0]?.originalPrice);
  const lowest = normalizedPrices.filter((price) => price.available).sort((a, b) => a.price - b.price)[0] || normalizedPrices[0];
  const discountPercentage = firstNumber(lowest.discountPercent, deal?.discount_percentage);
  const now = new Date().toISOString();

  const { data: comparison, error } = await supabaseAdmin
    .from(TABLE)
    .upsert({
      deal_id: productId,
      product_name: productName,
      image_url: imageUrl,
      category,
      original_price: originalPrice,
      lowest_price: lowest.price,
      discount_percentage: discountPercentage,
      product_url: deal?.affiliate_link || deal?.source_url || lowest.productUrl,
      store_name: lowest.platform,
      coupon_code: lowest.couponCode || "",
      rating: firstNumber(lowest.rating, 4.2),
      is_hot_deal: discountPercentage >= 50,
      is_free_deal: lowest.price === 0,
      last_updated: now
    }, { onConflict: "deal_id" })
    .select("id")
    .single();
  throwIfSupabaseError(error, TABLE);

  const comparisonId = comparison.id;
  const { error: deleteError } = await supabaseAdmin
    .from(PLATFORM_TABLE)
    .delete()
    .eq("comparison_id", comparisonId);
  throwIfSupabaseError(deleteError, PLATFORM_TABLE);

  const platformRows = normalizedPrices.map((price) => ({
    comparison_id: comparisonId,
    platform: normalizePlatformName(price.platform) || price.platform,
    platform_logo_url: price.platformLogoUrl || getPlatformLogo(price.platform),
    price: price.price,
    original_price: price.originalPrice,
    discount_percent: price.discountPercent,
    product_url: price.productUrl,
    affiliate_url: price.affiliateUrl || price.productUrl,
    available: price.available,
    is_available: price.available,
    delivery_info: price.deliveryInfo,
    delivery_charge: price.deliveryCharge,
    rating: price.rating,
    review_count: price.reviewCount,
    coupon_code: price.couponCode,
    is_lowest_price: price.platform === lowest.platform && price.price === lowest.price,
    last_updated: price.lastCheckedAt || now,
    last_checked_at: price.lastCheckedAt || now
  }));
  const { error: insertError } = await supabaseAdmin.from(PLATFORM_TABLE).insert(platformRows);
  if (insertError && isMissingOptionalColumnError(insertError)) {
    const strippedRows = platformRows.map(stripOptionalPlatformColumns);
    const { error: fallbackInsertError } = await supabaseAdmin.from(PLATFORM_TABLE).insert(strippedRows);
    throwIfSupabaseError(fallbackInsertError, PLATFORM_TABLE);
  } else {
    throwIfSupabaseError(insertError, PLATFORM_TABLE);
  }

  await updateDealPriceSummary(productId, lowest, normalizedPrices.length, now);
  return getPriceComparisonSummary(productId);
}

async function listDealBackedComparisons() {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("*, categories(*), stores(*)")
    .eq("status", "active")
    .or(nonExpiredDealFilter())
    .order("created_at", { ascending: false });
  throwIfSupabaseError(error, "deals");
  return (data || [])
    .map(toDealBackedPriceComparison)
    .filter((comparison) => comparison.ecommercePlatformPrices.some((price) => price.available && Number(price.price || 0) > 0));
}

function toApiPriceComparison(row) {
  const deal = row.deal || {};
  const platforms = (row[PLATFORM_TABLE] || [])
    .map(toApiStorePrice)
    .sort(compareStorePrices);
  return {
    productId: row.deal_id || row.id,
    id: row.id,
    dealId: row.deal_id,
    productName: row.product_name || deal.title || "",
    imageUrl: row.image_url || deal.final_image_url || deal.image_url || "",
    category: row.category || deal.categories?.name || "",
    originalPrice: Number(row.original_price || deal.original_price || 0),
    lowestPrice: Number(row.lowest_price || platforms.find((price) => price.available)?.price || deal.discounted_price || 0),
    discountPercent: Number(row.discount_percentage || 0),
    productUrl: row.product_url || deal.affiliate_link || deal.source_url || "",
    storeName: row.store_name || deal.stores?.name || "",
    couponCode: row.coupon_code || "",
    rating: Number(row.rating || 0),
    isHotDeal: Boolean(row.is_hot_deal),
    isFreeDeal: Boolean(row.is_free_deal),
    lastUpdated: row.last_updated,
    ecommercePlatformPrices: platforms
  };
}

function toApiStorePrice(row) {
  return {
    id: row.id || "",
    platform: row.platform || "",
    platformLogoUrl: row.platform_logo_url || getPlatformLogo(row.platform),
    platform_logo_url: row.platform_logo_url || getPlatformLogo(row.platform),
    price: Number(row.price || 0),
    originalPrice: nullableNumber(row.original_price),
    original_price: nullableNumber(row.original_price),
    discountPercent: nullableNumber(row.discount_percent),
    discount_percent: nullableNumber(row.discount_percent),
    productUrl: row.product_url || "",
    product_url: row.product_url || "",
    affiliateUrl: row.affiliate_url || "",
    affiliate_url: row.affiliate_url || "",
    available: row.is_available !== false && row.available !== false,
    isAvailable: row.is_available !== false && row.available !== false,
    is_available: row.is_available !== false && row.available !== false,
    deliveryInfo: row.delivery_info || "Free delivery",
    delivery_info: row.delivery_info || "Free delivery",
    deliveryCharge: nullableNumber(row.delivery_charge),
    delivery_charge: nullableNumber(row.delivery_charge),
    rating: Number(row.rating || 4.2),
    reviewCount: Number(row.review_count || 0),
    review_count: Number(row.review_count || 0),
    couponCode: row.coupon_code || "",
    coupon_code: row.coupon_code || "",
    isLowestPrice: Boolean(row.is_lowest_price),
    is_lowest_price: Boolean(row.is_lowest_price),
    lastUpdated: row.last_checked_at || row.last_updated,
    lastCheckedAt: row.last_checked_at || row.last_updated,
    last_checked_at: row.last_checked_at || row.last_updated
  };
}

function toDealBackedPriceComparison(row) {
  const store = row.stores || {};
  const category = row.categories || {};
  const currentPrice = Number(row.discounted_price || 0);
  const originalPrice = Number(row.original_price || currentPrice || 0);
  const discountPercent = Number(row.discount_percentage || 0);
  const affiliateUrl = row.affiliate_link || "";

  return {
    productId: row.id,
    id: row.id,
    dealId: row.id,
    productName: row.title || "",
    imageUrl: row.image_url || "",
    category: category.name || "",
    originalPrice,
    lowestPrice: currentPrice,
    discountPercent,
    productUrl: affiliateUrl,
    storeName: store.name || row.store_name || "",
    couponCode: row.coupon_code || "",
    rating: 4.3,
    isHotDeal: discountPercent >= 50 || Boolean(row.is_featured),
    isFreeDeal: currentPrice === 0,
    lastUpdated: row.updated_at || row.created_at,
    ecommercePlatformPrices: [
      {
        platform: store.name || row.store_name || "Store",
        platformLogoUrl: store.logo_url || getPlatformLogo(store.name || row.store_name || "Store"),
        platform_logo_url: store.logo_url || getPlatformLogo(store.name || row.store_name || "Store"),
        price: currentPrice,
        originalPrice,
        original_price: originalPrice,
        discountPercent,
        discount_percent: discountPercent,
        productUrl: affiliateUrl,
        product_url: affiliateUrl,
        affiliateUrl,
        affiliate_url: affiliateUrl,
        available: row.status === "active",
        isAvailable: row.status === "active",
        is_available: row.status === "active",
        deliveryInfo: "See store",
        delivery_info: "See store",
        deliveryCharge: null,
        delivery_charge: null,
        rating: 4.3,
        reviewCount: 0,
        review_count: 0,
        couponCode: row.coupon_code || "",
        coupon_code: row.coupon_code || "",
        isLowestPrice: true,
        is_lowest_price: true,
        lastUpdated: row.updated_at || row.created_at,
        lastCheckedAt: row.last_price_checked_at || row.updated_at || row.created_at,
        last_checked_at: row.last_price_checked_at || row.updated_at || row.created_at
      }
    ]
  };
}

module.exports = {
  getPriceComparison,
  getPriceComparisonSummary,
  listPriceComparisons,
  savePriceComparison
};

function nonExpiredDealFilter() {
  return `expiry_date.is.null,expiry_date.gt.${new Date().toISOString()}`;
}

function hasUsefulComparison(comparison) {
  const availablePlatforms = new Set(
    (comparison.ecommercePlatformPrices || [])
      .filter((price) => price.available && Number(price.price || 0) > 0)
      .map((price) => String(price.platform || "").trim().toLowerCase())
      .filter(Boolean)
  );
  return availablePlatforms.size >= 2;
}

function compareStorePrices(a, b) {
  if (a.available !== b.available) {
    return a.available ? -1 : 1;
  }
  return Number(a.price || 0) - Number(b.price || 0);
}

async function findDeal(productId) {
  if (!productId || !isUuid(productId)) return null;
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("*, categories(*), stores(*)")
    .eq("id", productId)
    .maybeSingle();
  if (isMissingTableError(error)) return null;
  throwIfSupabaseError(error, "deals");
  return data || null;
}

function toComparePriceResponse(comparison) {
  const normalized = normalizeLowestFlags(comparison);
  const prices = normalized.ecommercePlatformPrices.map((price) => ({
    id: price.id || `${normalized.productId}-${price.platform}`,
    platform: price.platform,
    platform_logo_url: price.platformLogoUrl || price.platform_logo_url || getPlatformLogo(price.platform),
    price: Number(price.price || 0),
    original_price: nullableNumber(price.originalPrice ?? price.original_price),
    discount_percent: nullableNumber(price.discountPercent ?? price.discount_percent),
    coupon_code: price.couponCode || price.coupon_code || null,
    delivery_charge: nullableNumber(price.deliveryCharge ?? price.delivery_charge),
    rating: nullableNumber(price.rating),
    review_count: Number(price.reviewCount || price.review_count || 0),
    product_url: price.productUrl || price.product_url || price.affiliateUrl || price.affiliate_url || "",
    is_lowest_price: Boolean(price.isLowestPrice || price.is_lowest_price),
    is_available: price.available !== false && price.is_available !== false,
    last_checked_at: price.lastCheckedAt || price.last_checked_at || price.lastUpdated || price.last_updated || normalized.lastUpdated
  }));
  const lowest = prices.find((price) => price.is_lowest_price) || prices.filter((price) => price.is_available).sort((a, b) => a.price - b.price)[0];
  return {
    product_id: normalized.productId,
    productId: normalized.productId,
    lowest_price: lowest?.price || normalized.lowestPrice || 0,
    lowestPrice: lowest?.price || normalized.lowestPrice || 0,
    best_platform: lowest?.platform || normalized.storeName || "",
    bestPlatform: lowest?.platform || normalized.storeName || "",
    comparison_count: prices.length,
    comparisonCount: prices.length,
    last_price_checked_at: lowest?.last_checked_at || normalized.lastUpdated || null,
    lastPriceCheckedAt: lowest?.last_checked_at || normalized.lastUpdated || null,
    prices,
    ecommercePlatformPrices: normalized.ecommercePlatformPrices
  };
}

function toDemoPriceComparison(productId, deal) {
  const now = new Date().toISOString();
  const title = String(deal?.title || "").toLowerCase();
  const demoRows = demoPlatformRows(title, deal?.affiliate_link || deal?.source_url || "", now);
  const currentPrice = Number(deal?.discounted_price || demoRows[0]?.price || 0);
  return normalizeLowestFlags({
    productId,
    id: productId,
    dealId: productId,
    productName: deal?.title || "Demo product",
    imageUrl: deal?.final_image_url || deal?.image_url || "",
    category: deal?.categories?.name || "Deals",
    originalPrice: Number(deal?.original_price || currentPrice * 2 || 0),
    lowestPrice: Math.min(...demoRows.map((row) => row.price)),
    discountPercent: Number(deal?.discount_percentage || 50),
    productUrl: deal?.affiliate_link || deal?.source_url || demoRows[0]?.productUrl || "",
    storeName: "Meesho",
    couponCode: deal?.coupon_code || "",
    rating: 4.2,
    isHotDeal: true,
    isFreeDeal: false,
    lastUpdated: now,
    ecommercePlatformPrices: demoRows
  });
}

function withDemoRows(comparison) {
  const now = new Date().toISOString();
  const rows = demoPlatformRows(comparison.productName, comparison.productUrl, now);
  return normalizeLowestFlags({
    ...comparison,
    ecommercePlatformPrices: rows
  });
}

function demoPlatformRows(title, productUrl, now) {
  const value = String(title || "").toLowerCase();
  const rows = comparisonPreset(value);
  return rows.map(({ platform, price, originalPrice, url }) => ({
    id: `demo-${String(platform).toLowerCase()}`,
    platform,
    platformLogoUrl: getPlatformLogo(platform),
    platform_logo_url: getPlatformLogo(platform),
    price,
    originalPrice,
    original_price: originalPrice,
    discountPercent: Math.round(((originalPrice - price) / originalPrice) * 100),
    discount_percent: Math.round(((originalPrice - price) / originalPrice) * 100),
    productUrl: url,
    product_url: url,
    affiliateUrl: url,
    affiliate_url: url,
    available: true,
    isAvailable: true,
    is_available: true,
    deliveryInfo: "Free delivery",
    delivery_info: "Free delivery",
    deliveryCharge: 0,
    delivery_charge: 0,
    rating: 4.2,
    reviewCount: 0,
    review_count: 0,
    couponCode: "",
    coupon_code: "",
    lastUpdated: now,
    lastCheckedAt: now,
    last_checked_at: now
  }));
}

function comparisonPreset(value) {
  if (/shoe|sneaker|adidas|nike|puma|decathlon|fashion/.test(value)) {
    return [
      demoRow("Decathlon", 1699, 2999, "https://www.decathlon.in/"),
      demoRow("Puma", 1799, 3499, "https://in.puma.com/"),
      demoRow("Ajio", 1899, 3999, "https://www.ajio.com/"),
      demoRow("Myntra", 1999, 3999, "https://www.myntra.com/"),
      demoRow("Adidas", 2299, 4599, "https://www.adidas.co.in/"),
      demoRow("Nike", 2499, 4995, "https://www.nike.com/in/")
    ];
  }
  if (/beauty|skin|cream|makeup|serum|mamaearth|nykaa|purplle/.test(value)) {
    return [
      demoRow("Purplle", 449, 899, "https://www.purplle.com/"),
      demoRow("Nykaa", 499, 999, "https://www.nykaa.com/"),
      demoRow("Mamaearth", 499, 999, "https://mamaearth.in/"),
      demoRow("Flipkart", 519, 999, "https://www.flipkart.com/"),
      demoRow("Amazon", 529, 999, "https://www.amazon.in/")
    ];
  }
  if (/grocery|atta|rice|oil|snack|combo|basket|blinkit|zepto|jiomart/.test(value)) {
    return [
      demoRow("JioMart", 699, 999, "https://www.jiomart.com/"),
      demoRow("Zepto", 719, 999, "https://www.zeptonow.com/"),
      demoRow("Blinkit", 729, 999, "https://blinkit.com/"),
      demoRow("Swiggy Instamart", 735, 999, "https://www.swiggy.com/instamart"),
      demoRow("BigBasket", 749, 999, "https://www.bigbasket.com/"),
      demoRow("Amazon", 799, 1099, "https://www.amazon.in/")
    ];
  }
  if (/watch|noise|smartwatch/.test(value)) {
    return [
      demoRow("Noise", 1299, 4999, "https://www.gonoise.com/"),
      demoRow("Flipkart", 1399, 4999, "https://www.flipkart.com/"),
      demoRow("Amazon", 1499, 4999, "https://www.amazon.in/"),
      demoRow("TataCliq", 1599, 4999, "https://www.tatacliq.com/"),
      demoRow("Reliance Digital", 1599, 4999, "https://www.reliancedigital.in/"),
      demoRow("Croma", 1699, 4999, "https://www.croma.com/")
    ];
  }
  if (/mobile|phone|iphone|samsung|oneplus|realme|xiaomi|\bmi\b/.test(value)) {
    return [
      demoRow("Flipkart", 12499, 18999, "https://www.flipkart.com/"),
      demoRow("JioMart", 12899, 18999, "https://www.jiomart.com/"),
      demoRow("Reliance Digital", 12949, 18999, "https://www.reliancedigital.in/"),
      demoRow("Amazon", 12999, 17999, "https://www.amazon.in/"),
      demoRow("Croma", 13299, 19999, "https://www.croma.com/"),
      demoRow("TataCliq", 13499, 19999, "https://www.tatacliq.com/"),
      demoRow("Samsung", 13999, 20999, "https://www.samsung.com/in/"),
      demoRow("OnePlus", 14299, 21999, "https://www.oneplus.in/")
    ];
  }
  return [
    demoRow("Meesho", 899, 1899, "https://www.meesho.com/"),
    demoRow("Flipkart", 949, 1999, "https://www.flipkart.com/"),
    demoRow("Amazon", 999, 1999, "https://www.amazon.in/"),
    demoRow("Croma", 1049, 2099, "https://www.croma.com/"),
    demoRow("Boat", 1099, 2499, "https://www.boat-lifestyle.com/"),
    demoRow("Reliance Digital", 1199, 2499, "https://www.reliancedigital.in/")
  ];
}

function demoRow(platform, price, originalPrice, url) {
  return { platform, price, originalPrice, url };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function normalizeLowestFlags(comparison) {
  const prices = (comparison.ecommercePlatformPrices || []).map((price) => ({ ...price }));
  const available = prices.filter((price) => price.available !== false && Number(price.price || 0) > 0);
  const lowest = available.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0];
  return {
    ...comparison,
    lowestPrice: lowest?.price || comparison.lowestPrice || 0,
    storeName: lowest?.platform || comparison.storeName || "",
    ecommercePlatformPrices: prices.map((price) => ({
      ...price,
      isLowestPrice: Boolean(lowest && price.platform === lowest.platform && Number(price.price) === Number(lowest.price)),
      is_lowest_price: Boolean(lowest && price.platform === lowest.platform && Number(price.price) === Number(lowest.price))
    }))
  };
}

function normalizeInputPrices(prices) {
  return (Array.isArray(prices) ? prices : [])
    .map((price) => {
      const numericPrice = Number(price.price);
      const platform = normalizePlatformName(price.platform) || String(price.platform || "").trim();
      const productUrl = String(price.product_url || price.productUrl || "").trim();
      if (!platform || !isSupportedPlatform(platform) || !Number.isFinite(numericPrice) || numericPrice < 0 || !/^https?:\/\//i.test(productUrl)) return null;
      return {
        platform,
        platformLogoUrl: price.platform_logo_url || price.platformLogoUrl || getPlatformLogo(platform),
        price: numericPrice,
        originalPrice: nullableNumber(price.original_price ?? price.originalPrice),
        discountPercent: nullableNumber(price.discount_percent ?? price.discountPercent),
        couponCode: price.coupon_code || price.couponCode || "",
        deliveryInfo: price.delivery_info || price.deliveryInfo || (Number(price.delivery_charge || price.deliveryCharge || 0) > 0 ? `Delivery ₹${Number(price.delivery_charge || price.deliveryCharge)}` : "Free delivery"),
        deliveryCharge: nullableNumber(price.delivery_charge ?? price.deliveryCharge),
        rating: nullableNumber(price.rating),
        reviewCount: Number(price.review_count || price.reviewCount || 0),
        productUrl,
        affiliateUrl: price.affiliate_url || price.affiliateUrl || productUrl,
        available: price.is_available !== false && price.available !== false,
        lastCheckedAt: price.last_checked_at || price.lastCheckedAt || new Date().toISOString()
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
}

async function updateDealPriceSummary(productId, lowest, count, now) {
  const payload = {
    lowest_price: lowest.price,
    best_platform: lowest.platform,
    comparison_count: count,
    last_price_checked_at: now,
    updated_at: now
  };
  const { error } = await supabaseAdmin.from("deals").update(payload).eq("id", productId);
  if (error && isMissingOptionalColumnError(error)) return;
  throwIfSupabaseError(error, "deals");
}

function stripOptionalPlatformColumns(row) {
  const copy = { ...row };
  [
    "platform_logo_url",
    "original_price",
    "discount_percent",
    "delivery_charge",
    "review_count",
    "is_lowest_price",
    "is_available",
    "last_checked_at"
  ].forEach((key) => delete copy[key]);
  return copy;
}

function isMissingOptionalColumnError(error) {
  return /column .* does not exist|could not find .* column|schema cache/i.test(error?.message || "");
}

function nullableNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}
