import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDealVotes } from "@/hooks/useDealVotes";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  dealId: string;
  compact?: boolean;
}

export default function DealVoteButtons({ dealId, compact = false }: Props) {
  const { user } = useAuth();
  const { score, userVote, vote } = useDealVotes(dealId);

  const handleVote = (v: 1 | -1) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to vote on deals." });
      return;
    }
    vote.mutate(v);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote(1); }}
          className={cn(
            "p-1 rounded transition-colors hover:bg-primary/10",
            userVote === 1 && "text-primary"
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <span className={cn(
          "text-xs font-semibold min-w-[20px] text-center tabular-nums",
          score > 0 && "text-primary",
          score < 0 && "text-destructive"
        )}>
          {score}
        </span>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote(-1); }}
          className={cn(
            "p-1 rounded transition-colors hover:bg-destructive/10",
            userVote === -1 && "text-destructive"
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5 h-8", userVote === 1 && "bg-primary/10 border-primary text-primary")}
        onClick={() => handleVote(1)}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        Upvote
      </Button>
      <span className={cn(
        "text-sm font-bold min-w-[24px] text-center tabular-nums",
        score > 0 && "text-primary",
        score < 0 && "text-destructive"
      )}>
        {score}
      </span>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5 h-8", userVote === -1 && "bg-destructive/10 border-destructive text-destructive")}
        onClick={() => handleVote(-1)}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
