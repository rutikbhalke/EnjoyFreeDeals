import { useQuery } from "@tanstack/react-query";
import { fetchDeals } from "@/lib/api";

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: () => fetchDeals({ limit: 48, sort: "newest" }),
  });
}

export function useFeaturedDeals() {
  return useQuery({
    queryKey: ["deals", "featured"],
    queryFn: () => fetchDeals({ limit: 6, hot: "true", sort: "newest" }),
  });
}

export function useTrendingDeals() {
  return useQuery({
    queryKey: ["deals", "trending"],
    queryFn: () => fetchDeals({ limit: 6, sort: "newest" }),
  });
}

export function useTopRatedDeals() {
  return useQuery({
    queryKey: ["deals", "top-rated"],
    queryFn: () => fetchDeals({ limit: 6, sort: "discount" }),
  });
}
