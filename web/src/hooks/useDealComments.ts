import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DealComment {
  id: string;
  user_id: string;
  deal_id: string;
  content: string;
  is_confirmation: boolean;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useDealComments(dealId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["deal-comments", dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_comments")
        .select("*")
        .eq("deal_id", dealId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for comment authors
      const userIds = [...new Set((data ?? []).map((c) => c.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
      );

      return (data ?? []).map((c) => ({
        ...c,
        profile: profileMap.get(c.user_id) ?? { full_name: null, avatar_url: null },
      })) as DealComment[];
    },
  });

  const confirmationCount = comments.filter((c) => c.is_confirmation).length;

  const addComment = useMutation({
    mutationFn: async ({ content, isConfirmation }: { content: string; isConfirmation: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("deal_comments").insert({
        deal_id: dealId!,
        user_id: user.id,
        content: content.trim(),
        is_confirmation: isConfirmation,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deal-comments", dealId] }),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("deal_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deal-comments", dealId] }),
  });

  return { comments, confirmationCount, isLoading, addComment, deleteComment };
}
