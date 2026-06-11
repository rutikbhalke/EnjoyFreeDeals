export type BuyScoreInput = {
  currentPrice?: number | null;
  averagePrice?: number | null;
  lowestPrice?: number | null;
  highestPrice?: number | null;
  discountPercent?: number | null;
  dealScore?: number | null;
  isHotDeal?: boolean | null;
  isBestPrice?: boolean | null;
  priceTrend?: string | null;
};

export type BuyScoreModel = {
  currentScore: number;
  scoreIn15Days: number;
  scoreIn30Days: number;
  recommendationTitle: string;
  recommendationSubtitle: string;
  priceTrend: string;
};

export function buildBuyScore(input: BuyScoreInput): BuyScoreModel {
  const currentScore = calculateBuyScore(input);
  const priceTrend = inferPriceTrend(input);
  return {
    currentScore,
    scoreIn15Days: predictedScore(currentScore, priceTrend, 15),
    scoreIn30Days: predictedScore(currentScore, priceTrend, 30),
    recommendationTitle: recommendationTitle(currentScore),
    recommendationSubtitle: recommendationSubtitle(currentScore),
    priceTrend,
  };
}

export function calculateBuyScore(input: BuyScoreInput): number {
  let score = 50;
  const currentPrice = safeNumber(input.currentPrice);
  const averagePrice = safeNumber(input.averagePrice);
  const lowestPrice = safeNumber(input.lowestPrice);
  const discountPercent = safeNumber(input.discountPercent);
  const dealScore = safeNumber(input.dealScore);

  if (currentPrice > 0 && averagePrice > 0) {
    const belowAverage = ((averagePrice - currentPrice) / averagePrice) * 100;
    if (belowAverage >= 20) score += 20;
    else if (belowAverage >= 10) score += 10;
    if (currentPrice > averagePrice) score -= 15;
  }

  if (currentPrice > 0 && lowestPrice > 0 && currentPrice <= lowestPrice * 1.05) score += 15;
  if (discountPercent >= 75) score += 15;
  else if (discountPercent >= 60) score += 10;
  if (discountPercent >= 0 && discountPercent < 20) score -= 10;
  if (dealScore >= 85) score += 10;
  if (dealScore > 0 && dealScore < 50) score -= 10;
  if (input.isHotDeal) score += 5;
  if (input.isBestPrice) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function recommendationTitle(score: number) {
  if (score >= 70) return "Great time to buy.";
  if (score >= 50) return "Good time to buy.";
  return "Wait for a better deal.";
}

export function recommendationSubtitle(score: number) {
  if (score >= 70) return "This deal looks strong. Current price is better than usual.";
  if (score >= 50) return "This deal is solid. Prices have been higher more often than lower.";
  return "This price may drop again. Track this deal before buying.";
}

export function predictedScore(score: number, trend: string, days: 15 | 30) {
  const delta = days === 15 ? 5 : 10;
  if (trend === "rising") return Math.max(0, score - delta);
  if (trend === "falling") return Math.min(100, score + delta);
  return score;
}

function inferPriceTrend(input: BuyScoreInput) {
  if (input.priceTrend) return input.priceTrend.toLowerCase();
  const currentPrice = safeNumber(input.currentPrice);
  const averagePrice = safeNumber(input.averagePrice);
  const lowestPrice = safeNumber(input.lowestPrice);
  if (currentPrice > 0 && averagePrice > 0 && currentPrice < averagePrice * 0.9) return "rising";
  if (currentPrice > 0 && lowestPrice > 0 && currentPrice > lowestPrice * 1.25) return "falling";
  return "stable";
}

function safeNumber(value?: number | null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

