import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Tag, ThumbsUp, Trash2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchUpvotedDeals, mapBackendDeal, removeUpvote } from "@/lib/api";
import { getUserId } from "@/lib/auth";

export default function UpvotedDealsPage() {
  const { isMobileLoggedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = isMobileLoggedIn ? getUserId() : "";

  useEffect(() => {
    if (!isMobileLoggedIn) {
      navigate("/login");
    }
  }, [isMobileLoggedIn, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["upvoted-deals", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchUpvotedDeals(userId),
  });

  const removeMutation = useMutation({
    mutationFn: (dealId: string) => removeUpvote(userId, dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upvoted-deals", userId] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast({ title: "Upvote removed" });
    },
    onError: (error) => {
      toast({
        title: "Could not remove upvote",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isMobileLoggedIn) return null;

  const deals = (data?.deals || [])
    .map((item) => item.deal ? mapBackendDeal(item.deal) : null)
    .filter(Boolean);

  return (
    <MainLayout>
      <SEO title="Upvoted Deals" description="Deals you have upvoted on EnjoyFreeDeals." canonical={`${SITE_URL}/profile/upvoted-deals`} noIndex />
      <div className="container max-w-4xl py-10 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Upvoted Deals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Deals you liked from your mobile login.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}><CardContent className="p-4"><Skeleton className="h-28 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <ThumbsUp className="h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-semibold">No upvoted deals yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Upvote a deal to see it here.</p>
              <Button asChild className="mt-5">
                <Link to="/deals">Browse Deals</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deals.map((deal: any) => (
              <Card key={deal.id} className="overflow-hidden">
                <CardContent className="grid gap-4 p-4 sm:grid-cols-[120px_1fr]">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-secondary">
                    {deal.image_url ? (
                      <img src={deal.image_url} alt={deal.title} className="h-full w-full object-cover" />
                    ) : (
                      <Tag className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-primary">{deal.stores?.name || "Store"}</p>
                      <h2 className="line-clamp-2 font-display text-lg font-bold">{deal.title}</h2>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      {deal.discounted_price != null && (
                        <span className="text-xl font-bold text-deal-save">{"\u20b9"}{deal.discounted_price.toLocaleString("en-IN")}</span>
                      )}
                      {deal.original_price != null && deal.discounted_price != null && deal.original_price > deal.discounted_price && (
                        <span className="text-sm text-muted-foreground line-through">{"\u20b9"}{deal.original_price.toLocaleString("en-IN")}</span>
                      )}
                      {deal.discount_percentage != null && deal.discount_percentage > 0 && (
                        <span className="rounded-full bg-deal-hot px-2 py-0.5 text-xs font-bold text-white">{Math.round(deal.discount_percentage)}% OFF</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/deals/${deal.slug}`}>View Details</Link>
                      </Button>
                      <Button size="sm" onClick={() => window.open(deal.affiliate_link || deal.product_url || "", "_blank", "noopener,noreferrer")}>
                        View Deal <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeMutation.mutate(deal.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Remove Upvote
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
