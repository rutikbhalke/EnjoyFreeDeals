import { useQuery } from "@tanstack/react-query";
import { apiGet, fetchDeals, mapBackendDeal, type BackendDeal } from "@/lib/api";
import { getGuestId, getUserId, isLoggedIn } from "@/lib/auth";

export function useDealBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["deal", slug],
    enabled: !!slug,
    queryFn: async () => {
      try {
        const userQuery = isLoggedIn()
          ? `?userId=${encodeURIComponent(getUserId())}`
          : `?guestId=${encodeURIComponent(getGuestId())}`;
        const deal = await apiGet<BackendDeal>(`/api/deals/${encodeURIComponent(slug!)}${userQuery}`);
        return mapBackendDeal(deal);
      } catch {
        const deals = await fetchDeals({ limit: 500 });
        return deals.find((deal) => deal.slug === slug || deal.id === slug) ?? null;
      }
    },
  });
}
