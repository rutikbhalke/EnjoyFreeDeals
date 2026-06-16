import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Copy, ExternalLink, Percent, Share2, Sparkles, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDealClickTracker } from "@/hooks/useDealClickTracker";
import { useToast } from "@/hooks/use-toast";
import { formatUpdatedTime } from "@/lib/api";
import DealVoteButtons from "./DealVoteButtons";

interface DealCardProps {
  deal: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    original_price: number | null;
    discounted_price: number | null;
    price_status?: string | null;
    price_min?: number | null;
    price_max?: number | null;
    manual_price_note?: string | null;
    discount_percentage: number | null;
    coupon_code: string | null;
    cashback_percentage: number | null;
    image_url: string | null;
    source_image_url?: string | null;
    affiliate_link: string | null;
    product_url?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
    stores: { name: string; logo_url: string | null; slug: string } | null;
    categories: { name: string; slug: string } | null;
  };
}

export default function DealCard({ deal }: DealCardProps) {
  const { trackAndOpen } = useDealClickTracker();
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUrl = validImageUrl(deal.image_url) || validImageUrl(deal.source_image_url);
  const updatedText = formatUpdatedTime(deal.updated_at || deal.created_at);
  const hasPriceRange = deal.price_status === "manual_added" && (deal.price_min != null || deal.price_max != null);
  const isNew = Boolean(deal.created_at && Date.now() - new Date(deal.created_at).getTime() < 24 * 60 * 60 * 1000);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {imageUrl ? (
          <>
            {!imageLoaded && <div className="absolute inset-0 bg-secondary animate-pulse" />}
            <img
              src={imageUrl}
              alt={`${deal.title} - deal image`}
              className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105 blur-sm"}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
          </>
        ) : deal.stores?.logo_url ? (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <img
              src={deal.stores.logo_url}
              alt={`${deal.stores.name} logo`}
              className="h-16 w-16 object-contain opacity-80"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted text-muted-foreground">
            <Tag className="h-10 w-10 opacity-60" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        <button
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-card"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const url = `${window.location.origin}/deals/${deal.slug}`;
            if (navigator.share) {
              navigator.share({ title: deal.title, url });
            } else {
              navigator.clipboard.writeText(url);
              toast({ title: "Link copied!", description: "Deal link copied to clipboard" });
            }
          }}
          aria-label="Share deal"
        >
          <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {deal.discount_percentage != null && deal.discount_percentage > 0 && (
          <Badge className="absolute left-3 top-3 bg-deal-hot text-white border-0 font-semibold text-xs shadow-lg">
            {Math.round(deal.discount_percentage)}% OFF
          </Badge>
        )}

        {isNew && (
          <Badge className="absolute right-3 top-3 bg-emerald-500 text-white border-0 text-xs shadow-lg">
            <Sparkles className="mr-1 h-3 w-3" />
            New
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {deal.stores && (
          <div className="flex items-center gap-2 mb-2">
            {deal.stores.logo_url ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary border border-border">
                <img
                  src={deal.stores.logo_url}
                  alt={`${deal.stores.name} logo`}
                  className="h-4 w-4 rounded object-contain"
                />
              </div>
            ) : null}
            <span className="text-xs font-medium text-muted-foreground">{deal.stores.name}</span>
            {deal.categories && (
              <>
                <span className="text-muted-foreground/40">-</span>
                <span className="text-xs text-muted-foreground">{deal.categories.name}</span>
              </>
            )}
          </div>
        )}

        <Link to={`/deals/${deal.slug}`} className="block">
          <h3 className="font-display font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {deal.title}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mb-3">
          {hasPriceRange ? (
            <span className="font-display text-lg font-bold text-deal-save">
              {"\u20b9"}{(deal.price_min ?? deal.price_max)?.toLocaleString("en-IN")} - {"\u20b9"}{(deal.price_max ?? deal.price_min)?.toLocaleString("en-IN")}
            </span>
          ) : deal.discounted_price != null && (
            <span className="font-display text-lg font-bold text-deal-save">
              {"\u20b9"}{deal.discounted_price.toLocaleString("en-IN")}
            </span>
          )}
          {deal.original_price != null && deal.discounted_price != null && deal.original_price > deal.discounted_price && (
            <span className="text-sm text-muted-foreground line-through">
              {"\u20b9"}{deal.original_price.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{updatedText}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {deal.cashback_percentage != null && deal.cashback_percentage > 0 && (
            <Badge variant="secondary" className="text-xs font-medium bg-deal-cashback/10 text-deal-cashback border-deal-cashback/20">
              <Percent className="mr-1 h-3 w-3" />
              {deal.cashback_percentage}% Cashback
            </Badge>
          )}
          {deal.coupon_code && (
            <Badge
              variant="outline"
              className="text-xs font-mono tracking-wide cursor-pointer hover:bg-accent gap-1 transition-colors"
              onClick={(event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(deal.coupon_code!);
                toast({ title: "Coupon copied!", description: deal.coupon_code! });
              }}
            >
              {deal.coupon_code}
              <Copy className="h-3 w-3 opacity-50" />
            </Badge>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <DealVoteButtons
            dealId={deal.id}
            compact
            initialCount={Number((deal as any).upvote_count || 0)}
            initialUpvoted={Boolean((deal as any).user_has_upvoted)}
          />
          <Button
            size="sm"
            className="flex-1 gap-2 font-semibold transition-transform hover:scale-[1.02]"
            onClick={() => trackAndOpen(deal.id, deal.affiliate_link || deal.product_url || null)}
          >
            View Deal
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full font-semibold"
          asChild
        >
          <Link to={`/deals/${deal.slug}`}>View Details</Link>
        </Button>
      </div>
    </article>
  );
}

function validImageUrl(value?: string | null): string | null {
  const imageUrl = String(value || "").trim();
  return /^https?:\/\//i.test(imageUrl) ? imageUrl : null;
}
