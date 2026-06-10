const { badgesForDeal, calculateDealScore } = require("./dealScore");
const { detectCategory } = require("./categoryDetector");
const { dedupeKey } = require("./duplicateDetector");
const { detectPlatformFromTextAndUrl, isSupportedPlatform } = require("./platformDetector");
const { extractCouponCode, extractPrices, extractProductUrl, extractTitle } = require("./priceExtractor");
const { isHomepageUrl, normalizeUrl } = require("./urlUtils");

async function parseDealText(payload) {
  const message = String(payload.message || "");
  const initialUrl = payload.productUrl || extractProductUrl(message);
  const { platform, resolvedUrl } = await detectPlatformFromTextAndUrl(message, initialUrl);
  const productUrl = normalizeUrl(resolvedUrl || initialUrl);
  const { originalPrice, dealPrice, discountPercent } = extractPrices(message);
  const extractedTitle = extractTitle(message);
  const couponCode = extractCouponCode(message);
  const productTitle = normalizeProductTitle(extractedTitle, platform, dealPrice);
  const category = detectCategory(productTitle, message, productUrl || platform);
  const isStrongLowPrice = dealPrice > 0 && dealPrice <= cheapPriceLimit();
  const signals = detectDealSignals(message);
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
    ...signals,
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
  const hasOfferSignal = hasCouponSignal || deal.hasFreeSignal || deal.hasBankOfferSignal || deal.hasCashbackSignal || deal.hasLootSignal;
  const hasPriceSignal = Number(deal.dealPrice || 0) > 0;
  if (!isSupportedPlatform(deal.platform)) return "Unsupported platform";
  if (!deal.productTitle || deal.productTitle.length < 5) return "Invalid product title";
  if (!deal.productUrl || !/^https?:\/\//i.test(deal.productUrl)) return "Invalid product URL";
  if (isHomepageUrl(deal.productUrl)) return "Homepage URL is not a product deal";
  if (!hasPriceSignal && !hasOfferSignal) return "No price/coupon/free offer found";
  if (deal.dealPrice < 0 || deal.originalPrice < 0) return "Price cannot be negative";
  if (deal.originalPrice > 0 && deal.dealPrice > 0 && deal.dealPrice > deal.originalPrice) return "Deal price is greater than original price";
  return "";
}

function cheapPriceLimit() {
  const value = Number(process.env.TELEGRAM_CHEAP_PRICE_LIMIT || 199);
  return Number.isFinite(value) && value > 0 ? value : 199;
}

function detectDealSignals(text) {
  const value = String(text || "").toLowerCase();
  return {
    hasFreeSignal: /\b(free|freebie|free sample|sample free)\b/.test(value),
    hasBankOfferSignal: /\b(bank offer|credit card|debit card|emi|upi|card offer)\b/.test(value),
    hasCashbackSignal: /\b(cashback|cash back)\b/.test(value),
    hasLootSignal: /\b(loot|lo0t|steal deal|hot deal)\b/.test(value)
  };
}

module.exports = { detectCategory, parseDealText, validateDeal };
