import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VoteData {
  score: number;
  userVote: number | null; // 1, -1, or null
}

export function useDealVotes(dealId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["deal-votes", dealId, user?.id],
    enabled: !!dealId,
    queryFn: async (): Promise<VoteData> => {
      // Get total score
      const { data: votes, error } = await supabase
        .from("deal_votes")
        .select("vote")
        .eq("deal_id", dealId!);
      if (error) throw error;

      const score = (votes ?? []).reduce((sum, v) => sum + v.vote, 0);

      // Get user's vote
      let userVote: number | null = null;
      if (user) {
        const { data: myVote } = await supabase
          .from("deal_votes")
          .select("vote")
          .eq("deal_id", dealId!)
          .eq("user_id", user.id)
          .maybeSingle();
        userVote = myVote?.vote ?? null;
      }

      return { score, userVote };
    },
  });

  const vote = useMutation({
    mutationFn: async (newVote: 1 | -1) => {
      if (!user) throw new Error("Must be logged in");

      const currentVote = data?.userVote;

      if (currentVote === newVote) {
        // Remove vote (toggle off)
        await supabase
          .from("deal_votes")
          .delete()
          .eq("deal_id", dealId!)
          .eq("user_id", user.id);
      } else if (currentVote) {
        // Change vote
        await supabase
          .from("deal_votes")
          .update({ vote: newVote })
          .eq("deal_id", dealId!)
          .eq("user_id", user.id);
      } else {
        // New vote
        await supabase
          .from("deal_votes")
          .insert({ deal_id: dealId!, user_id: user.id, vote: newVote });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-votes", dealId] });
    },
  });

  return {
    score: data?.score ?? 0,
    userVote: data?.userVote ?? null,
    isLoading,
    vote,
  };
}
