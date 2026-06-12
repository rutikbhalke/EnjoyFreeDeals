import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { fetchDeals } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 12;

export interface DealFilters {
  categories: string[];
  stores: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: string;
  search: string;
}

export function useFilterParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: DealFilters = {
    categories: searchParams.getAll("category"),
    stores: searchParams.getAll("store"),
    minPrice: searchParams.get("min") ? Number(searchParams.get("min")) : null,
    maxPrice: searchParams.get("max") ? Number(searchParams.get("max")) : null,
    sort: searchParams.get("sort") || "newest",
    search: searchParams.get("q") || "",
  };

  const setFilters = (updated: Partial<DealFilters>) => {
    const next = new URLSearchParams();
    const merged = { ...filters, ...updated };

    merged.categories.forEach((c) => next.append("category", c));
    merged.stores.forEach((s) => next.append("store", s));
    if (merged.minPrice != null) next.set("min", String(merged.minPrice));
    if (merged.maxPrice != null) next.set("max", String(merged.maxPrice));
    if (merged.sort && merged.sort !== "newest") next.set("sort", merged.sort);
    if (merged.search) next.set("q", merged.search);

    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

  return { filters, setFilters, clearFilters };
}

export function useFilteredDeals(filters: DealFilters) {
  const { displayMobile } = useAuth();
  return useInfiniteQuery({
    queryKey: ["deals", "filtered", filters, displayMobile],
    queryFn: async ({ pageParam = 0 }) => {
      const deals = await fetchDeals({
        page: pageParam + 1,
        limit: PAGE_SIZE,
        search: filters.search || undefined,
        category: filters.categories[0],
        platform: filters.stores[0],
        sort: filters.sort === "discount" || filters.sort === "top-rated" ? "discount" : filters.sort === "price-asc" ? "price" : "newest",
      });

      return deals.filter((deal) => {
        const price = Number(deal.discounted_price ?? 0);
        if (filters.minPrice != null && price < filters.minPrice) return false;
        if (filters.maxPrice != null && price > filters.maxPrice) return false;
        return true;
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
  });
}
