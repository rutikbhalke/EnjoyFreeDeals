const TRUSTED_PLATFORM_POINTS = 15;

function calculateDealScore(deal) {
  const discountPoints = Math.min(35, Math.round((Number(deal.discountPercent || 0) / 100) * 35));
  const pricePoints = lowestPricePoints(Number(deal.dealPrice || 0));
  const platformPoints = deal.platform ? TRUSTED_PLATFORM_POINTS : 0;
  const couponPoints = deal.couponCode ? 10 : 0;
  const freshnessPoints = 10;
  return Math.min(100, discountPoints + pricePoints + platformPoints + couponPoints + freshnessPoints);
}

function lowestPricePoints(price) {
  if (price <= 0) return 0;
  if (price <= 99) return 30;
  if (price <= 299) return 26;
  if (price <= 999) return 22;
  if (price <= 1999) return 16;
  if (price <= 4999) return 10;
  return 6;
}

function badgesForDeal(deal) {
  const discount = Number(deal.discountPercent || 0);
  const score = Number(deal.dealScore || 0);
  return {
    isHotDeal: discount >= 60 || score >= 85,
    isSuperHotDeal: discount >= 75 || score >= 95,
    isBestPrice: Boolean(deal.isBestPrice),
    isCouponDeal: Boolean(deal.couponCode),
    isFreeDeal: Boolean(deal.hasFreeSignal)
  };
}

module.exports = { badgesForDeal, calculateDealScore };
