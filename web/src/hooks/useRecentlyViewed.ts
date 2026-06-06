import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRecentlyViewed(limit = 8) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recently-viewed", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get distinct recent deal views
      const { data: activity } = await supabase
        .from("user_activity")
        .select("deal_id")
        .eq("user_id", user!.id)
        .eq("event_type", "deal_view")
        .not("deal_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!activity || activity.length === 0) return [];

      // Deduplicate deal_ids preserving order
      const seen = new Set<string>();
      const dealIds: string[] = [];
      for (const row of activity) {
        if (row.deal_id && !seen.has(row.deal_id)) {
          seen.add(row.deal_id);
          dealIds.push(row.deal_id);
          if (dealIds.length >= limit) break;
        }
      }

      if (dealIds.length === 0) return [];

      const { data: deals } = await supabase
        .from("deals")
        .select("*, stores(*), categories(*)")
        .in("id", dealIds)
        .eq("status", "active");

      if (!deals) return [];

      // Preserve recently-viewed order
      const dealMap = new Map(deals.map((d) => [d.id, d]));
      return dealIds.map((id) => dealMap.get(id)).filter(Boolean);
    },
  });
}
