import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getUserId } from "@/lib/auth";
import { removeUpvote, upvoteDeal } from "@/lib/api";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCount(initialCount);
    setUpvoted(initialUpvoted);
  }, [initialCount, initialUpvoted, dealId]);

  const handleUpvote = async () => {
    if (!isMobileLoggedIn) {
      toast({
        title: "Login required",
        description: "Please login with mobile number to upvote deals.",
      });
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const previousCount = count;
    const previousUpvoted = upvoted;
    const nextUpvoted = !upvoted;
    setUpvoted(nextUpvoted);
    setCount((value) => Math.max(0, value + (nextUpvoted ? 1 : -1)));
    setIsSaving(true);

    try {
      const response = nextUpvoted
        ? await upvoteDeal(getUserId(), dealId)
        : await removeUpvote(getUserId(), dealId);
      setUpvoted(response.upvoted);
      setCount(Number(response.upvote_count || 0));
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["upvoted-deals"] });
    } catch (error) {
      setCount(previousCount);
      setUpvoted(previousUpvoted);
      toast({
        title: "Upvote failed",
        description: error instanceof Error ? error.message : "Please try again.",
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
