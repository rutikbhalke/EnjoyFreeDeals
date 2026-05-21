function toApiDeal(row) {
  const store = row.stores || {};
  const category = row.categories || {};
  const currentPrice = Number(row.discounted_price || 0);
  const originalPrice = Number(row.original_price || currentPrice || 0);
  const discountPercent = Number(row.discount_percentage || 0);

  return {
    dealId: row.id,
    id: row.id,
    title: row.title || "",
    slug: row.slug || "",
    description: row.description || "",
    productImage: row.image_url || "",
    originalPrice,
    discountedPrice: currentPrice,
    discountPercent,
    storeId: row.store_id,
    storeName: store.name || row.store_name || "",
    storeLogo: store.logo_url || "",
    categoryId: row.category_id,
    categoryName: category.name || "",
    categorySlug: category.slug || "",
    dealType: row.source || "manual",
    dealUrl: row.affiliate_link || "",
    productUrl: row.affiliate_link || "",
    affiliateUrl: row.affiliate_link || "",
    couponCode: row.coupon_code || "",
    cashbackPercentage: Number(row.cashback_percentage || 0),
    isHotDeal: discountPercent >= 50 || Boolean(row.is_featured),
    isFreeDeal: currentPrice === 0,
    isActive: row.status === "active",
    isFeatured: Boolean(row.is_featured),
    isVerified: Boolean(row.is_verified),
    shareCount: 0,
    savedCount: 0,
    clickCount: Number(row.click_count || 0),
    voteScore: Number(row.vote_score || 0),
    currentPrice,
    lowestPrice: currentPrice,
    highestPrice: originalPrice,
    averagePrice: originalPrice && currentPrice ? (originalPrice + currentPrice) / 2 : currentPrice,
    rating: 4.3,
    deliveryInfo: "See store",
    comparisonPrices: [],
    source: row.source || "manual",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiryDate: row.expiry_date
  };
}

function normalizeDealPayload(payload) {
  const normalized = { ...payload };
  mapIfPresent(normalized, "dealId", "id");
  mapIfPresent(normalized, "productImage", "image_url");
  mapIfPresent(normalized, "discountPercent", "discount_percentage");
  mapIfPresent(normalized, "categoryId", "category_id");
  mapIfPresent(normalized, "dealType", "source");
  mapIfPresent(normalized, "dealUrl", "affiliate_link");
  mapIfPresent(normalized, "productUrl", "affiliate_link");
  mapIfPresent(normalized, "affiliateUrl", "affiliate_link");
  mapIfPresent(normalized, "couponCode", "coupon_code");
  mapIfPresent(normalized, "cashbackPercentage", "cashback_percentage");
  mapIfPresent(normalized, "isFeatured", "is_featured");
  mapIfPresent(normalized, "expiryDate", "expiry_date");
  mapIfPresent(normalized, "createdAt", "created_at");
  mapIfPresent(normalized, "updatedAt", "updated_at");
  mapIfPresent(normalized, "clickCount", "click_count");
  mapIfPresent(normalized, "isVerified", "is_verified");
  mapIfPresent(normalized, "voteScore", "vote_score");
  if (Object.prototype.hasOwnProperty.call(payload, "isActive")) {
    normalized.status = payload.isActive ? "active" : "inactive";
    delete normalized.isActive;
  }
  return normalized;
}

function mapIfPresent(target, from, to) {
  if (Object.prototype.hasOwnProperty.call(target, from)) {
    target[to] = target[from];
    delete target[from];
  }
}

module.exports = { normalizeDealPayload, toApiDeal };
