import { useQuery } from "@tanstack/react-query";
import { fetchDeals } from "@/lib/api";

export function useRelatedDeals(
  dealId: string | undefined,
  categorySlug: string | null | undefined,
  storeSlug: string | null | undefined,
) {
  return useQuery({
    queryKey: ["deals", "related", dealId, categorySlug, storeSlug],
    enabled: !!dealId,
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        limit: 8,
        sort: "newest",
      };

      if (categorySlug) {
        params.category = categorySlug;
      } else if (storeSlug) {
        params.platform = storeSlug;
      }

      const deals = await fetchDeals(params);
      // Exclude the current deal and return up to 4
      return deals.filter((d) => d.id !== dealId).slice(0, 4);
    },
  });
}
