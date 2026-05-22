const { supabaseAdmin } = require("../config/supabaseClient");
const { isMissingTableError, throwIfSupabaseError } = require("../utils/supabaseErrors");

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
  return (data || []).map(toApiPriceComparison);
}

async function getPriceComparison(productId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, price_comparison_platforms(*)")
    .or(`id.eq.${productId},deal_id.eq.${productId}`)
    .maybeSingle();
  if (isMissingTableError(error)) {
    const comparisons = await listDealBackedComparisons();
    return comparisons.find((item) => item.productId === productId || item.dealId === productId) || null;
  }
  throwIfSupabaseError(error, TABLE);
  return data ? toApiPriceComparison(data) : null;
}

async function listDealBackedComparisons() {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("*, categories(*), stores(*)")
    .eq("status", "active")
    .or(nonExpiredDealFilter())
    .order("created_at", { ascending: false });
  throwIfSupabaseError(error, "deals");
  return (data || []).map(toDealBackedPriceComparison);
}

function toApiPriceComparison(row) {
  return {
    productId: row.deal_id || row.id,
    id: row.id,
    dealId: row.deal_id,
    productName: row.product_name || "",
    imageUrl: row.image_url || "",
    category: row.category || "",
    originalPrice: Number(row.original_price || 0),
    lowestPrice: Number(row.lowest_price || 0),
    discountPercent: Number(row.discount_percentage || 0),
    productUrl: row.product_url || "",
    storeName: row.store_name || "",
    couponCode: row.coupon_code || "",
    rating: Number(row.rating || 0),
    isHotDeal: Boolean(row.is_hot_deal),
    isFreeDeal: Boolean(row.is_free_deal),
    lastUpdated: row.last_updated,
    ecommercePlatformPrices: (row[PLATFORM_TABLE] || []).map(toApiStorePrice)
  };
}

function toApiStorePrice(row) {
  return {
    platform: row.platform || "",
    price: Number(row.price || 0),
    productUrl: row.product_url || "",
    affiliateUrl: row.affiliate_url || "",
    available: row.available !== false,
    deliveryInfo: row.delivery_info || "Free delivery",
    rating: Number(row.rating || 4.2),
    couponCode: row.coupon_code || "",
    lastUpdated: row.last_updated
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
        price: currentPrice,
        productUrl: affiliateUrl,
        affiliateUrl,
        available: row.status === "active",
        deliveryInfo: "See store",
        rating: 4.3,
        couponCode: row.coupon_code || "",
        lastUpdated: row.updated_at || row.created_at
      }
    ]
  };
}

module.exports = { getPriceComparison, listPriceComparisons };

function nonExpiredDealFilter() {
  return `expiry_date.is.null,expiry_date.gt.${new Date().toISOString()}`;
}
