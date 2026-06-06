import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useWatchlist(dealId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchEntry, isLoading } = useQuery({
    queryKey: ["watchlist", dealId, user?.id],
    enabled: !!dealId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_watchlist")
        .select("*")
        .eq("deal_id", dealId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const addToWatchlist = useMutation({
    mutationFn: async (targetPrice?: number) => {
      const { error } = await supabase.from("deal_watchlist").insert({
        deal_id: dealId!,
        user_id: user!.id,
        target_price: targetPrice ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist", dealId] }),
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("deal_watchlist")
        .delete()
        .eq("deal_id", dealId!)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist", dealId] }),
  });

  return {
    isWatching: !!watchEntry,
    watchEntry,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
  };
}
