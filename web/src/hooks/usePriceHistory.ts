import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PriceHistoryPoint {
  price: number;
  recorded_at: string;
}

export function usePriceHistory(dealId: string | undefined) {
  return useQuery({
    queryKey: ["price-history", dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_history")
        .select("price, recorded_at")
        .eq("deal_id", dealId!)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PriceHistoryPoint[];
    },
  });
}
