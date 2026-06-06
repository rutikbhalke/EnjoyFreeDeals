import { useQuery } from "@tanstack/react-query";
import { apiGet, fetchDeals, mapBackendDeal, type BackendDeal } from "@/lib/api";

export function useDealBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["deal", slug],
    enabled: !!slug,
    queryFn: async () => {
      try {
        const deal = await apiGet<BackendDeal>(`/api/deals/${encodeURIComponent(slug!)}`);
        return mapBackendDeal(deal);
      } catch {
        const deals = await fetchDeals({ limit: 200, search: slug });
        return deals.find((deal) => deal.slug === slug || deal.id === slug) ?? null;
      }
    },
  });
}
