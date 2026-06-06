const { badgesForDeal, calculateDealScore } = require("./dealScore");
const { dedupeKey } = require("./duplicateDetector");
const { detectPlatformFromTextAndUrl, isSupportedPlatform } = require("./platformDetector");
const { extractCouponCode, extractPrices, extractProductUrl, extractTitle } = require("./priceExtractor");

async function parseDealText(payload) {
  const message = String(payload.message || "");
  const initialUrl = payload.productUrl || extractProductUrl(message);
  const { platform, resolvedUrl } = await detectPlatformFromTextAndUrl(message, initialUrl);
  const productUrl = resolvedUrl || initialUrl;
  const productTitle = extractTitle(message);
  const { originalPrice, dealPrice, discountPercent } = extractPrices(message);
  const couponCode = extractCouponCode(message);
  const category = detectCategory(`${productTitle}\n${message}\n${platform}`);
  const baseDeal = {
    platform,
    productTitle,
    originalPrice,
    dealPrice,
    discountPercent,
    couponCode,
    productUrl,
    category,
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

function validateDeal(deal) {
  const hasCouponSignal = Boolean(deal.couponCode);
  if (!isSupportedPlatform(deal.platform)) return "Unsupported platform";
  if (!deal.productTitle || deal.productTitle.length < 5) return "Invalid product title";
  if (!deal.productUrl || !/^https?:\/\//i.test(deal.productUrl)) return "Invalid product URL";
  if (!deal.dealPrice || deal.dealPrice <= 0) return "Deal price missing";
  if (deal.dealPrice < 0 || deal.originalPrice < 0) return "Price cannot be negative";
  if (deal.originalPrice > 0 && deal.dealPrice > deal.originalPrice) return "Deal price is greater than original price";
  if (deal.discountPercent < 50 && !hasCouponSignal) return "Discount below 50%";
  if (deal.dealScore < 70) return "Deal score below 70";
  return "";
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
