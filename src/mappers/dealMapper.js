function toApiDeal(row) {
  const store = row.stores || {};
  const category = row.categories || {};
  const currentPrice = safePrice(row.discounted_price);
  const originalPrice = safePrice(row.original_price || currentPrice || 0);
  const discountPercent = safeDiscount(row.discount_percentage, originalPrice, currentPrice);
  const productImage = resolveDealImage(row);
  const dealUrl = resolveDealUrl(row);
  const lastScrapedAt = row.source_updated_at || row.fetched_at || row.last_scraped_at || row.updated_at || row.created_at || null;
  const platformExpiresAt = row.platform_expires_at || row.expiry_date || null;
  const categoryName = category.name || row.category_name || "Other Deals";
  const isExpired = Boolean(row.is_expired) || Boolean(platformExpiresAt && new Date(platformExpiresAt).getTime() <= Date.now()) || row.status === "expired";
  const isValid = isValidDealPrice(originalPrice, currentPrice) && isHttpUrl(dealUrl);

  return {
    dealId: row.id,
    id: row.id,
    title: row.title || "",
    slug: row.slug || "",
    description: row.description || "",
    productImage,
    imageUrl: productImage,
    sourceImageUrl: row.source_image_url || row.raw_source_payload?.sourceImageUrl || row.raw_source_payload?.imageUrl || "",
    originalPrice,
    dealPrice: currentPrice,
    discountedPrice: currentPrice,
    discountPercent,
    currency: row.currency || "INR",
    platformProductId: row.source_product_id || row.raw_source_payload?.platformProductId || row.raw_source_payload?.asin || row.raw_source_payload?.sku || "",
    storeId: row.store_id,
    storeName: store.name || row.store_name || "",
    storeLogo: store.logo_url || "",
    categoryId: row.category_id,
    categoryName,
    categorySlug: category.slug || slugify(categoryName),
    dealType: row.source || "manual",
    dealUrl,
    productUrl: dealUrl,
    platformProductUrl: row.platform_product_url || row.raw_source_payload?.platformProductUrl || dealUrl,
    affiliateUrl: dealUrl,
    couponCode: row.coupon_code || "",
    cashbackPercentage: Number(row.cashback_percentage || 0),
    isHotDeal: discountPercent >= 50 || Boolean(row.is_featured),
    isFreeDeal: currentPrice === 0,
    isExpired,
    isValid,
    isActive: row.status === "active" && !isExpired && isValid,
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
    fetchedAt: row.fetched_at || lastScrapedAt,
    lastCheckedAt: row.last_checked_at || row.updated_at || lastScrapedAt,
    sourceUpdatedAt: row.source_updated_at || row.raw_source_payload?.sourceUpdatedAt || row.raw_source_payload?.normalizedAt || null,
    platformExpiresAt,
    expiresAt: platformExpiresAt,
    lastScrapedAt,
    scrapedAt: lastScrapedAt,
    scrapeExpiresAt: platformExpiresAt,
    scrapeValidHours: null,
    expiryDate: platformExpiresAt
  };
}

function isAutomatedScrapedDeal(row) {
  if (!row || row.status !== "active" || !row.source_url || !row.dedupe_key) return false;
  const mode = row.raw_source_payload?.connectorMode || "";
  if (!["html-scrape", "telegram-bot", "telegram-page", "direct-platform-fetch"].includes(mode)) return false;
  if (row.is_valid === false || row.is_expired === true) return false;
  if (row.discounted_price < 0 || (row.original_price > 0 && row.discounted_price > row.original_price)) return false;
  const platformExpiresAt = row.platform_expires_at || row.expiry_date || null;
  if (platformExpiresAt && new Date(platformExpiresAt).getTime() <= Date.now()) return false;
  const timestamp = row.source_updated_at || row.fetched_at || row.last_scraped_at || row.updated_at || row.created_at;
  return Boolean(timestamp && new Date(timestamp).getTime() >= Date.now() - 24 * 60 * 60 * 1000);
}

function normalizeDealPayload(payload) {
  const normalized = { ...payload };
  mapIfPresent(normalized, "dealId", "id");
  mapIfPresent(normalized, "productImage", "image_url");
  mapIfPresent(normalized, "imageUrl", "image_url");
  mapIfPresent(normalized, "sourceImageUrl", "source_image_url");
  mapIfPresent(normalized, "platformProductUrl", "platform_product_url");
  mapIfPresent(normalized, "photoUrl", "image_url");
  mapIfPresent(normalized, "thumbnailUrl", "image_url");
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
  mapIfPresent(normalized, "expiresAt", "platform_expires_at");
  mapIfPresent(normalized, "platformExpiresAt", "platform_expires_at");
  mapIfPresent(normalized, "sourceUpdatedAt", "source_updated_at");
  mapIfPresent(normalized, "platformProductId", "source_product_id");
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

function resolveDealImage(row) {
  const raw = row.raw_source_payload || {};
  const nested = raw.metadata || raw.product || {};
  const storedCandidates = [
    row.image_url,
    raw.imageUrl,
    raw.image_url,
    raw.productImage,
    raw.product_image,
    raw.photoUrl,
    raw.photo_url,
    raw.thumbnailUrl,
    raw.thumbnail_url,
    raw.thumbnail,
    raw.ogImage,
    raw.og_image,
    nested.imageUrl,
    nested.image_url,
    nested.photoUrl,
    nested.thumbnailUrl
  ];
  const generatedCandidates = [
    amazonImageFromUrl(raw.resolvedProductUrl),
    amazonImageFromUrl(raw.sourceUrl),
    amazonImageFromUrl(row.source_url),
    amazonImageFromUrl(row.affiliate_link)
  ];

  return [
    ...generatedCandidates,
    ...storedCandidates.filter((value) => !isKnownFallbackImage(value) && !isTelegramPreviewImage(value)),
    ...storedCandidates.filter((value) => !isKnownFallbackImage(value)),
    ...storedCandidates
  ]
    .map((value) => String(value || "").trim())
    .find(isHttpUrl) || "";
}

function safePrice(value) {
  const price = Number(value || 0);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

function safeDiscount(value, originalPrice, currentPrice) {
  const discount = Number(value || 0);
  if (Number.isFinite(discount) && discount >= 0 && discount <= 100) return Math.round(discount);
  if (originalPrice > 0 && currentPrice >= 0 && currentPrice <= originalPrice) {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
  return 0;
}

function isValidDealPrice(originalPrice, currentPrice) {
  if (!Number.isFinite(currentPrice) || currentPrice < 0) return false;
  if (originalPrice > 0 && currentPrice > originalPrice) return false;
  return true;
}

function resolveDealUrl(row) {
  return [
    row.affiliate_link,
    row.source_url,
    row.raw_source_payload?.sourceUrl,
    row.raw_source_payload?.telegramPostUrl
  ]
    .map((value) => String(value || "").trim())
    .find((value) => isHttpUrl(value) && !isImageAssetUrl(value)) || "";
}

function amazonImageFromUrl(value) {
  const asin = amazonAsinFromUrl(value);
  return asin
    ? `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${encodeURIComponent(asin)}&Format=_SL500_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1`
    : "";
}

function amazonAsinFromUrl(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (!host.includes("amazon.")) return "";

    const path = decodeURIComponent(parsed.pathname);
    return path.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1]?.toUpperCase() || "";
  } catch {
    return "";
  }
}

function slugify(value) {
  return String(value || "other-deals")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "other-deals";
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isKnownFallbackImage(value) {
  const imageUrl = String(value || "").trim();
  return Object.values(FALLBACK_DEAL_IMAGES).includes(imageUrl);
}

function isImageAssetUrl(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    return host.includes("telesco.pe") ||
      host.includes("cdn-telegram.org") ||
      /\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(pathname);
  } catch {
    return false;
  }
}

function isTelegramPreviewImage(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return host.includes("telesco.pe") || host.includes("cdn-telegram.org");
  } catch {
    return false;
  }
}

const FALLBACK_DEAL_IMAGES = {
  electronics: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80",
  mobile: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  fashion: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
  shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  home: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=900&q=80",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
  general: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80"
};

module.exports = { isAutomatedScrapedDeal, normalizeDealPayload, toApiDeal };
