import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getUserId } from "@/lib/auth";
import { upvoteDeal } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  dealId: string;
  compact?: boolean;
  initialCount?: number;
  initialUpvoted?: boolean;
}

export default function DealVoteButtons({
  dealId,
  compact = false,
  initialCount = 0,
  initialUpvoted = false,
}: Props) {
  const { isMobileLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCount(initialCount);
    setUpvoted(initialUpvoted);
  }, [initialCount, initialUpvoted, dealId]);

  const handleUpvote = async () => {
    const previousCount = count;
    const previousUpvoted = upvoted;
    if (!upvoted) {
      setUpvoted(true);
      setCount((value) => value + 1);
    }
    setIsSaving(true);

    try {
      const response = await upvoteDeal(dealId, isMobileLoggedIn ? getUserId() : undefined);
      setUpvoted(response.upvoted);
      setCount(Number(response.upvoteCount ?? response.upvote_count ?? 0));
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["upvoted-deals"] });
    } catch (error) {
      setCount(previousCount);
      setUpvoted(previousUpvoted);
      const rawMessage = error instanceof Error ? error.message : "";
      const description = rawMessage.includes("deal_upvotes")
        ? "Upvote table missing. Please run database migration."
        : "Unable to upvote right now. Please try again.";
      toast({
        title: "Upvote failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleUpvote();
        }}
        disabled={isSaving}
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-2 text-xs font-semibold transition-colors",
          upvoted ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40 hover:text-primary"
        )}
        aria-label={upvoted ? "Remove upvote" : "Upvote deal"}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span>{upvoted ? "Upvoted" : "Upvote"}</span>
        <span className="tabular-nums">{count}</span>
      </button>
    );
  }

  return (
    <Button
      variant={upvoted ? "default" : "outline"}
      size="sm"
      className={cn("gap-1.5 h-9", upvoted && "bg-primary text-primary-foreground")}
      onClick={handleUpvote}
      disabled={isSaving}
    >
      <ThumbsUp className="h-3.5 w-3.5" />
      {upvoted ? "Upvoted" : "Upvote"}
      <span className="tabular-nums">({count})</span>
    </Button>
  );
}
