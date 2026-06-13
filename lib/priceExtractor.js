function extractPrices(text) {
  const value = String(text || "");
  const priceToken = String.raw`(?:rs\.?|\u20b9|₹|â‚¹|inr)`;
  const numberToken = String.raw`([0-9][0-9,]*(?:\.[0-9]+)?)`;
  const explicitDeal = firstMoney(value.match(new RegExp(String.raw`(?:deal price|offer price|sale price|price|only|now|from|starting|starts at|@|for|just)\s*${priceToken}?\s*${numberToken}`, "i")));
  const explicitOriginal = firstMoney(value.match(new RegExp(String.raw`(?:mrp|original|was|list price|regular price)\s*${priceToken}?\s*${numberToken}`, "i")));
  const allPrices = [
    ...value.matchAll(new RegExp(String.raw`${priceToken}\s*${numberToken}`, "gi")),
    ...value.matchAll(/([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:rs\.?|inr)\b/gi),
    ...value.matchAll(/(?:^|\n|\s)([1-9][0-9,]{1,5})(?=\s+https?:\/\/)/gi)
  ]
    .map((match) => toMoney(match[1]))
    .filter((price) => price > 0);
  const explicitDiscount = extractDiscountPercent(value);
  const dealPrice = explicitDeal || (allPrices.length ? Math.min(...allPrices) : 0);
  const inferredOriginal = explicitDiscount > 0 && dealPrice > 0 && explicitDiscount < 100
    ? Math.round((dealPrice / (1 - explicitDiscount / 100)) * 100) / 100
    : 0;
  const originalPrice = explicitOriginal || inferredOriginal || (allPrices.length ? Math.max(...allPrices) : dealPrice);
  const discountPercent = explicitDiscount || calculateDiscountPercent(originalPrice, dealPrice);

  return { originalPrice, dealPrice, discountPercent };
}

function extractCouponCode(text) {
  const value = String(text || "");
  const match = value.match(/(?:coupon|code|promo|promo code|discount code|use code|apply coupon|apply code)\s*[:#-]?\s*([A-Z0-9]{4,24})/i);
  return match ? match[1].toUpperCase() : "";
}

function extractProductUrl(text) {
  const match = String(text || "").match(/https?:\/\/[^\s)>\]]+/i);
  return match ? match[0].replace(/[.,]+$/, "") : "";
}

function extractTitle(text) {
  const firstLine = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !/^https?:\/\//i.test(line) && !/^(coupon|code|price|mrp)\b/i.test(line));
  return cleanTitle(firstLine || String(text || "").slice(0, 120));
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:mrp|original|was|list price|regular price|deal price|offer price|sale price|now|only|price)\s*(?:rs\.?|\u20b9|₹|â‚¹|inr)?\s*[0-9][0-9,]*(?:\.[0-9]+)?/gi, " ")
    .replace(/\b[1-9][0-9]?\s*%\s*(?:off|discount)?\b/gi, " ")
    .replace(/\b(?:ends?|valid|offer ends|sale ends|limited time)\b.*$/i, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function firstMoney(match) {
  return match ? toMoney(match[1]) : 0;
}

function toMoney(value) {
  return Number(String(value || "").replace(/,/g, "")) || 0;
}

function calculateDiscountPercent(originalPrice, dealPrice) {
  if (!originalPrice || !dealPrice || originalPrice <= dealPrice) return 0;
  return Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
}

function extractDiscountPercent(text) {
  const matches = [...String(text || "").matchAll(/\b(?:flat\s*)?([1-9][0-9]?)\s*%\s*(?:off|discount)?\b/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 100);
  return matches.length ? Math.max(...matches) : 0;
}

module.exports = {
  calculateDiscountPercent,
  extractCouponCode,
  extractDiscountPercent,
  extractPrices,
  extractProductUrl,
  extractTitle
};
