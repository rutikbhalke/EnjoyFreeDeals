const { badgesForDeal, calculateDealScore } = require("./dealScore");
const { dedupeKey } = require("./duplicateDetector");
const { detectPlatformFromTextAndUrl, isSupportedPlatform } = require("./platformDetector");
const { extractCouponCode, extractPrices, extractProductUrl, extractTitle } = require("./priceExtractor");

async function parseDealText(payload) {
  const message = String(payload.message || "");
  const initialUrl = payload.productUrl || extractProductUrl(message);
  const { platform, resolvedUrl } = await detectPlatformFromTextAndUrl(message, initialUrl);
  const productUrl = resolvedUrl || initialUrl;
  const { originalPrice, dealPrice, discountPercent } = extractPrices(message);
  const extractedTitle = extractTitle(message);
  const couponCode = extractCouponCode(message);
  const productTitle = normalizeProductTitle(extractedTitle, platform, dealPrice);
  const category = detectCategory(`${productTitle}\n${message}\n${platform}`);
  const isStrongLowPrice = dealPrice > 0 && dealPrice <= cheapPriceLimit();
  const baseDeal = {
    platform,
    productTitle,
    originalPrice,
    dealPrice,
    discountPercent,
    couponCode,
    productUrl,
    category,
    isStrongLowPrice,
    imageUrl: payload.imageUrl || payload.image_url || "",
    sourceChannel: payload.sourceChannel || payload.source_channel || "",
    telegramMessageId: payload.telegramMessageId || payload.telegram_message_id || ""
  };
  const dealScore = calculateDealScore(baseDeal);

  return {
    ...baseDeal,
    dealScore,
    ...badgesForDeal({ ...baseDeal, dealScore }),
    dedupeKey: dedupeKey(baseDeal)
  };
}

function normalizeProductTitle(title, platform, dealPrice) {
  const value = String(title || "").trim();
  if (!value || /^\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b\s+\d{1,2}\s+\d+(?:\.\d+)?$/i.test(value)) {
    return `${platform || "Shopping"} deal${dealPrice > 0 ? ` at Rs. ${dealPrice}` : ""}`;
  }
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    return `${platform || "Shopping"} deal at Rs. ${value}`;
  }
  return value;
}

function validateDeal(deal) {
  const hasCouponSignal = Boolean(deal.couponCode);
  const hasStrongLowPriceSignal = Boolean(deal.isStrongLowPrice);
  if (!isSupportedPlatform(deal.platform)) return "Unsupported platform";
  if (!deal.productTitle || deal.productTitle.length < 5) return "Invalid product title";
  if (!deal.productUrl || !/^https?:\/\//i.test(deal.productUrl)) return "Invalid product URL";
  if (!deal.dealPrice || deal.dealPrice <= 0) return "Deal price missing";
  if (deal.dealPrice < 0 || deal.originalPrice < 0) return "Price cannot be negative";
  if (deal.originalPrice > 0 && deal.dealPrice > deal.originalPrice) return "Deal price is greater than original price";
  if (deal.discountPercent < 50 && !hasCouponSignal && !hasStrongLowPriceSignal) return "Discount below 50%";
  if (deal.dealScore < 70 && !hasStrongLowPriceSignal) return "Deal score below 70";
  return "";
}

function cheapPriceLimit() {
  const value = Number(process.env.TELEGRAM_CHEAP_PRICE_LIMIT || 199);
  return Number.isFinite(value) && value > 0 ? value : 199;
}

function detectCategory(text) {
  const value = String(text || "").toLowerCase();
  if (/laptop|notebook|macbook/.test(value)) return "Laptop";
  if (/phone|mobile|smartphone/.test(value)) return "Mobile";
  if (/earbud|speaker|watch|camera|charger|tablet|headphone|tv|television/.test(value)) return "Electronics";
  if (/shirt|shoe|jeans|dress|fashion|bag|backpack|kurti|kurta|saree/.test(value)) return "Fashion";
  if (/beauty|skin|makeup|cosmetic|moisturiser|moisturizer|cream|serum|shampoo/.test(value)) return "Beauty";
  if (/rice|oil|atta|grocery|snack|tea|coffee|food/.test(value)) return "Grocery";
  if (/appliance|mixer|grinder|washing machine|refrigerator|fridge|microwave|ac\b|air conditioner/.test(value)) return "Appliances";
  if (/kitchen|home|storage|container|bottle|furniture|decor|sofa|bedsheet|chair|pan|cooker/.test(value)) return "Home & Kitchen";
  if (/amazon|amzn\.to/.test(value)) return "Amazon Deals";
  if (/flipkart|fkrt|flpkrt/.test(value)) return "Flipkart Deals";
  return "Other Deals";
}

module.exports = { detectCategory, parseDealText, validateDeal };
