function extractPrices(text) {
  const value = String(text || "");
  const explicitDeal = firstMoney(value.match(/(?:deal|offer|price|only|now|@)\s*(?:rs\.?|₹|inr)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i));
  const explicitOriginal = firstMoney(value.match(/(?:mrp|original|was)\s*(?:rs\.?|₹|inr)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i));
  const allPrices = [...value.matchAll(/(?:rs\.?|₹|inr)\s*([0-9][0-9,]*(?:\.[0-9]+)?)/gi)]
    .map((match) => toMoney(match[1]))
    .filter((price) => price > 0);
  const dealPrice = explicitDeal || (allPrices.length ? Math.min(...allPrices) : 0);
  const originalPrice = explicitOriginal || (allPrices.length ? Math.max(...allPrices) : dealPrice);
  const discountPercent = calculateDiscountPercent(originalPrice, dealPrice);

  return { originalPrice, dealPrice, discountPercent };
}

function extractCouponCode(text) {
  const value = String(text || "");
  const match = value.match(/(?:coupon|code|apply)\s*:?\s*([A-Z0-9]{4,20})/i);
  return match ? match[1].toUpperCase() : "";
}

function extractProductUrl(text) {
  const match = String(text || "").match(/https?:\/\/[^\s)]+/i);
  return match ? match[0].replace(/[.,]+$/, "") : "";
}

function extractTitle(text) {
  const firstLine = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !/^https?:\/\//i.test(line));
  return cleanTitle(firstLine || String(text || "").slice(0, 120));
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/https?:\/\/\S+/gi, "")
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

module.exports = {
  calculateDiscountPercent,
  extractCouponCode,
  extractPrices,
  extractProductUrl,
  extractTitle
};
