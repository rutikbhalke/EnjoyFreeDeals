import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRecommendedDeals(limit = 8) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recommended-deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get user's most-interacted categories and stores
      const { data: activity } = await supabase
        .from("user_activity")
        .select("category_id, store_id")
        .eq("user_id", user!.id)
        .not("category_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!activity || activity.length === 0) return [];

      // Count category and store frequency
      const catCount = new Map<string, number>();
      const storeCount = new Map<string, number>();
      for (const row of activity) {
        if (row.category_id) catCount.set(row.category_id, (catCount.get(row.category_id) ?? 0) + 1);
        if (row.store_id) storeCount.set(row.store_id, (storeCount.get(row.store_id) ?? 0) + 1);
      }

      const topCategories = [...catCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
      const topStores = [...storeCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);

      // Fetch deals matching top categories or stores
      let query = supabase
        .from("deals")
        .select("*, stores(*), categories(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (topCategories.length > 0) {
        query = query.in("category_id", topCategories);
      }

      const { data: deals } = await query;
      return deals ?? [];
    },
  });
}
