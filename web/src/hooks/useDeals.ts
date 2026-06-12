import { useQuery } from "@tanstack/react-query";
import { fetchDeals } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useDeals() {
  const { displayMobile } = useAuth();
  return useQuery({
    queryKey: ["deals", displayMobile],
    queryFn: () => fetchDeals({ limit: 48, sort: "newest" }),
  });
}

export function useFeaturedDeals() {
  const { displayMobile } = useAuth();
  return useQuery({
    queryKey: ["deals", "featured", displayMobile],
    queryFn: () => fetchDeals({ limit: 6, hot: "true", sort: "newest" }),
  });
}

export function useTrendingDeals() {
  const { displayMobile } = useAuth();
  return useQuery({
    queryKey: ["deals", "trending", displayMobile],
    queryFn: () => fetchDeals({ limit: 6, sort: "newest" }),
  });
}

export function useTopRatedDeals() {
  const { displayMobile } = useAuth();
  return useQuery({
    queryKey: ["deals", "top-rated", displayMobile],
    queryFn: () => fetchDeals({ limit: 6, sort: "discount" }),
  });
}
