import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, MessageSquare, Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useDealComments } from "@/hooks/useDealComments";
import { toast } from "@/hooks/use-toast";

interface Props {
  dealId: string;
}

export default function DealCommentSection({ dealId }: Props) {
  const { user } = useAuth();
  const { comments, confirmationCount, isLoading, addComment, deleteComment } = useDealComments(dealId);
  const [content, setContent] = useState("");
  const [isConfirmation, setIsConfirmation] = useState(false);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      toast({ title: "Too long", description: "Comment must be under 1000 characters.", variant: "destructive" });
      return;
    }
    addComment.mutate(
      { content: trimmed, isConfirmation },
      {
        onSuccess: () => {
          setContent("");
          setIsConfirmation(false);
          toast({ title: "Comment posted!" });
        },
        onError: () => toast({ title: "Error", description: "Could not post comment.", variant: "destructive" }),
      }
    );
  };

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-display text-lg font-bold">
            Comments ({comments.length})
          </h3>
        </div>
        {confirmationCount > 0 && (
          <Badge className="bg-deal-save/10 text-deal-save border-deal-save/20 gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            {confirmationCount} confirmed this works
          </Badge>
        )}
      </div>

      {/* Add comment form */}
      {user ? (
        <div className="mb-6 space-y-3">
          <Textarea
            placeholder="Share a tip, confirm this deal works, or warn about issues..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={isConfirmation}
                onCheckedChange={(v) => setIsConfirmation(v === true)}
              />
              <CheckCircle className="h-3.5 w-3.5 text-deal-save" />
              I confirm this deal works
            </label>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSubmit}
              disabled={!content.trim() || addComment.isPending}
            >
              <Send className="h-3.5 w-3.5" />
              {addComment.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          <a href="/auth" className="text-primary hover:underline">Sign in</a> to leave a comment.
        </p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const initials = comment.profile?.full_name
              ? comment.profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
              : "U";
            return (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate">
                      {comment.profile?.full_name || "Anonymous"}
                    </span>
                    {comment.is_confirmation && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-deal-save/10 text-deal-save gap-0.5">
                        <CheckCircle className="h-2.5 w-2.5" /> Confirmed
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
                {user?.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => deleteComment.mutate(comment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
