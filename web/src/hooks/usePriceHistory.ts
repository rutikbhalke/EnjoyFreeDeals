import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export interface PriceHistoryPoint {
  price: number;
  recorded_at: string;
  date?: string;
  platform?: string | null;
}

export interface PriceHistorySummary {
  product_id: string;
  history: PriceHistoryPoint[];
  average_price: number;
  lowest_price: number;
  highest_price: number;
}

export function usePriceHistory(dealId: string | undefined) {
  return useQuery({
    queryKey: ["price-history", dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const summary = await apiGet<PriceHistorySummary>(`/api/price-history?productId=${encodeURIComponent(dealId!)}`);
      return {
        ...summary,
        history: (summary.history || []).map((point) => ({
          ...point,
          recorded_at: point.recorded_at || point.date || new Date().toISOString(),
          price: Number(point.price || 0),
        })),
      };
    },
  });
}
