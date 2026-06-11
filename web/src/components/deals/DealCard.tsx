import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Copy, ArrowRight, Percent, Share2, Sparkles, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUrl = validImageUrl(deal.image_url) || validImageUrl(deal.source_image_url);
  const updatedText = formatUpdatedTime(deal.updated_at || deal.created_at);
  const isNew = Boolean(deal.created_at && Date.now() - new Date(deal.created_at).getTime() < 24 * 60 * 60 * 1000);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      {/* Image Container */}
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
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted p-6">
            <img
              src={deal.stores.logo_url}
              alt={`${deal.stores.name} logo`}
              className="max-h-full max-w-full object-contain opacity-80"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted text-muted-foreground">
            <Tag className="h-10 w-10 opacity-60" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Share Button Overlay */}
        <button
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/85 backdrop-blur-sm border border-border opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-card shadow-sm"
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

        {/* Discount Badge */}
        {deal.discount_percentage != null && deal.discount_percentage > 0 && (
          <Badge className="absolute left-3 top-3 bg-deal-hot text-white border-0 font-bold text-xs shadow-md">
            {Math.round(deal.discount_percentage)}% OFF
          </Badge>
        )}

        {/* New Badge */}
        {isNew && (
          <Badge className="absolute right-3 top-3 bg-emerald-500 text-white border-0 text-xs shadow-md">
            <Sparkles className="mr-1 h-3 w-3" />
            New
          </Badge>
        )}
      </div>

      {/* Info Container */}
      <div className="flex flex-1 flex-col p-4">
        {/* Store & Category Row */}
        {deal.stores && (
          <div className="flex items-center gap-2 mb-2">
            {deal.stores.logo_url ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary border border-border overflow-hidden p-0.5 shrink-0">
                <img
                  src={deal.stores.logo_url}
                  alt={`${deal.stores.name} logo`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}
            <span className="text-xs font-semibold text-foreground/80">{deal.stores.name}</span>
            {deal.categories && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <span className="text-[11px] text-muted-foreground">{deal.categories.name}</span>
              </>
            )}
          </div>
        )}

        {/* Title */}
        <Link to={`/deals/${deal.slug}`} className="block">
          <h3 className="font-display font-bold text-sm leading-snug mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {deal.title}
          </h3>
        </Link>

        {/* Pricing Row */}
        <div className="flex items-baseline gap-2 mb-3">
          {deal.discounted_price != null && (
            <span className="font-display text-lg font-bold text-deal-save">
              ₹{deal.discounted_price.toLocaleString("en-IN")}
            </span>
          )}
          {deal.original_price != null && deal.discounted_price != null && deal.original_price > deal.discounted_price && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{deal.original_price.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Cashback & Coupon Row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {deal.cashback_percentage != null && deal.cashback_percentage > 0 && (
            <Badge variant="secondary" className="text-[10px] font-bold bg-deal-cashback/10 text-deal-cashback border-deal-cashback/20 px-2 py-0">
              <Percent className="mr-0.5 h-2.5 w-2.5" />
              {deal.cashback_percentage}% Cashback
            </Badge>
          )}
          {deal.coupon_code && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-bold tracking-wide cursor-pointer hover:bg-accent gap-1 transition-colors px-2 py-0 border-primary/20 bg-primary/[0.02] text-primary"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                navigator.clipboard.writeText(deal.coupon_code!);
                toast({ title: "Coupon copied!", description: deal.coupon_code! });
              }}
            >
              {deal.coupon_code}
              <Copy className="h-2.5 w-2.5 opacity-60" />
            </Badge>
          )}
        </div>

        {/* Footer Info & View Deal Button */}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{updatedText}</span>
          </div>

          <Button
            size="sm"
            className="font-bold text-xs h-8 gap-1 rounded-lg px-3 transition-all hover:gap-1.5"
            asChild
          >
            <Link to={`/deals/${deal.slug}`}>
              View Deal
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function validImageUrl(value?: string | null): string | null {
  const imageUrl = String(value || "").trim();
  return /^https?:\/\//i.test(imageUrl) ? imageUrl : null;
}
