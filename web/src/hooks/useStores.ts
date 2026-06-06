import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStores(limit?: number) {
  return useQuery({
    queryKey: ["stores", limit],
    queryFn: async () => {
      let query = supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
