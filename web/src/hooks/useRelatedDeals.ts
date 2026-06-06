import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRelatedDeals(dealId: string | undefined, categoryId: string | null | undefined, storeId: string | undefined) {
  return useQuery({
    queryKey: ["deals", "related", dealId],
    enabled: !!dealId,
    queryFn: async () => {
      let query = supabase
        .from("deals")
        .select("*, stores(*), categories(*)")
        .eq("status", "active")
        .neq("id", dealId!)
        .limit(4);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      } else if (storeId) {
        query = query.eq("store_id", storeId);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
