import { useQuery } from "@tanstack/react-query";
import { fetchPriceComparison } from "@/lib/api";

export function usePriceComparison(productId: string | undefined) {
  return useQuery({
    queryKey: ["price-comparison", productId],
    enabled: Boolean(productId),
    queryFn: () => fetchPriceComparison(productId!),
    staleTime: 5 * 60 * 1000,
  });
}
