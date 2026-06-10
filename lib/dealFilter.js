const { badgesForDeal, calculateDealScore } = require("./dealScore");
const { dedupeKey } = require("./duplicateDetector");
const { detectPlatform, isSupportedPlatform } = require("./platformDetector");
const { extractCouponCode, extractPrices, extractProductUrl, extractTitle } = require("./priceExtractor");
const { isActualProductUrl, normalizeUrl } = require("./urlUtils");

function parseTelegramDeal(payload) {
  const message = String(payload.message || "");
  const productUrl = normalizeUrl(extractProductUrl(message));
  const platform = detectPlatform(`${message} ${productUrl}`);
  const productTitle = extractTitle(message);
  const { originalPrice, dealPrice, discountPercent } = extractPrices(message);
  const couponCode = extractCouponCode(message);
  const baseDeal = {
    platform,
    productTitle,
    originalPrice,
    dealPrice,
    discountPercent,
    couponCode,
    productUrl,
    imageUrl: payload.image_url || payload.imageUrl || "",
    sourceChannel: payload.source_channel || payload.sourceChannel || "",
    telegramMessageId: payload.telegram_message_id || payload.telegramMessageId || ""
  };
  const dealScore = calculateDealScore(baseDeal);
  return {
    ...baseDeal,
    dealScore,
    ...badgesForDeal({ ...baseDeal, dealScore }),
    dedupeKey: dedupeKey(baseDeal)
  };
}

function validateFilteredDeal(deal) {
  if (!isSupportedPlatform(deal.platform)) return "Unsupported platform";
  if (!deal.productTitle || deal.productTitle.length < 5) return "Invalid product title";
  if (!deal.dealPrice || deal.dealPrice <= 0) return "Deal price missing";
  if (deal.dealPrice < 0 || deal.originalPrice < 0) return "Price cannot be negative";
  if (deal.originalPrice > 0 && deal.dealPrice > deal.originalPrice) return "Deal price is greater than original price";
  if (!deal.productUrl || !isActualProductUrl(deal.platform, deal.productUrl)) return "Invalid product URL. Homepage URLs are not allowed for price comparison.";
  if (deal.discountPercent < 50) return "Discount below 50%";
  if (deal.dealScore < 70) return "Deal score below 70";
  return "";
}

module.exports = { parseTelegramDeal, validateFilteredDeal };
