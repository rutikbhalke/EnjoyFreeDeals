import { apiGet, PriceComparison } from "@/lib/api";

export async function getPriceComparison(productId: string): Promise<PriceComparison | null> {
  if (!productId) return null;

  try {
    const comparison = await apiGet<PriceComparison>(`/api/compare-price?productId=${encodeURIComponent(productId)}`);
    if (comparison && comparison.prices && comparison.prices.length > 0) {
      return comparison;
    }
  } catch (error) {
    console.warn("[price-comparison-service] backend lookup failed, returning empty comparison structure:", error);
  }

  return null;
}
