import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Clock, Copy, ExternalLink, Percent, Tag, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL, SITE_NAME } from "@/components/SEO";
import DealCard from "@/components/deals/DealCard";
import { useDealBySlug } from "@/hooks/useDealBySlug";
import { useRelatedDeals } from "@/hooks/useRelatedDeals";
import { useDealClickTracker } from "@/hooks/useDealClickTracker";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { usePriceComparison } from "@/hooks/usePriceComparison";
import PriceSummaryCards from "@/components/deals/PriceSummaryCards";
import PriceComparisonPanel from "@/components/deals/PriceComparisonPanel";
import PriceHistoryChart from "@/components/deals/PriceHistoryChart";
import BuyScoreCard from "@/components/deals/BuyScoreCard";
import WatchDealButton from "@/components/deals/WatchDealButton";
import DealVoteButtons from "@/components/deals/DealVoteButtons";
import { formatUpdatedTime } from "@/lib/api";

export default function DealDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: deal, isLoading } = useDealBySlug(slug);
  const { data: related } = useRelatedDeals(deal?.id, deal?.categories?.slug ?? null, deal?.stores?.slug ?? null);
  const { trackAndOpen } = useDealClickTracker();
  const { trackDealView } = useActivityTracker();
  const isMobile = useIsMobile();
  const { data: priceHistorySummary } = usePriceHistory(deal?.id);
  const { data: priceComparison, isLoading: isComparisonLoading } = usePriceComparison(deal?.id);

  // Track deal view on page load
  useEffect(() => {
    if (deal) {
      trackDealView(deal.id, undefined, undefined);
    }
  }, [deal?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-5 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!deal) {
    return (
      <MainLayout>
        <div className="container mx-auto px-5 py-20 text-center">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Deal Not Found</h1>
          <p className="text-muted-foreground mb-6">This deal is not available right now.</p>
          <Button asChild>
            <Link to="/deals">Browse All Deals</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const savings =
    deal.original_price != null && deal.discounted_price != null
      ? deal.original_price - deal.discounted_price
      : null;

  const updatedText = formatUpdatedTime(deal.updated_at || deal.created_at);
  const history = priceHistorySummary?.history || [];
  const historyPrices = history
    .map((point: any) => Number(point.price || point.price_amount || point.current_price || 0))
    .filter((price) => Number.isFinite(price) && price > 0);
  const currentPrice = Number(deal.discounted_price || deal.lowest_price || deal.original_price || 0);
  const fallbackAverage = historyPrices.length ? historyPrices.reduce((sum, price) => sum + price, 0) / historyPrices.length : currentPrice;
  const priceSummary = {
    averagePrice: priceHistorySummary?.average_price || Math.round(fallbackAverage || 0),
    lowestPrice: priceHistorySummary?.lowest_price || (historyPrices.length ? Math.min(...historyPrices) : currentPrice),
    highestPrice: priceHistorySummary?.highest_price || (historyPrices.length ? Math.max(...historyPrices) : Number(deal.original_price || currentPrice)),
  };
  const buyScoreInput = {
    currentPrice: deal.discounted_price,
    averagePrice: priceSummary.averagePrice || deal.original_price,
    lowestPrice: deal.lowest_price || priceSummary.lowestPrice || deal.discounted_price,
    highestPrice: priceSummary.highestPrice || deal.original_price,
    discountPercent: deal.discount_percentage,
    dealScore: deal.deal_score,
    isHotDeal: deal.is_hot_deal,
    isBestPrice: deal.is_best_price,
  };

  const copyCoupon = () => {
    if (deal.coupon_code) {
      navigator.clipboard.writeText(deal.coupon_code);
      toast({ title: "Coupon copied!", description: deal.coupon_code });
    }
  };

  const shareDeal = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: deal.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with your friends." });
    }
  };

  const openComparisonDeal = (url: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <MainLayout>
      <SEO
        title={deal.title}
        description={deal.description || `Get ${deal.discount_percentage ? Math.round(deal.discount_percentage) + '% off' : 'a great deal'} on ${deal.title}${deal.stores?.name ? ' at ' + deal.stores.name : ''}.`}
        ogImage={deal.image_url || undefined}
        ogType="product"
        canonical={`${SITE_URL}/deals/${deal.slug}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: deal.title,
            description: deal.description,
            image: deal.image_url,
            url: `${SITE_URL}/deals/${deal.slug}`,
            offers: {
              "@type": "Offer",
              price: deal.discounted_price ?? deal.original_price,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              seller: deal.stores ? { "@type": "Organization", name: deal.stores.name } : undefined,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Deals", item: `${SITE_URL}/deals` },
              ...(deal.categories ? [{ "@type": "ListItem", position: 3, name: deal.categories.name, item: `${SITE_URL}/deals?category=${deal.categories.slug}` }] : []),
              { "@type": "ListItem", position: deal.categories ? 4 : 3, name: deal.title },
            ],
          },
        ]}
      />
      <div className={`container mx-auto px-5 py-8 ${isMobile ? 'pb-24' : ''}`}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/deals" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Deals
          </Link>
          {deal.categories && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground/70">{deal.categories.name}</span>
            </>
          )}
        </nav>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_390px] gap-8 items-start">
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
            {deal.image_url ? (
              <img src={deal.image_url} alt={deal.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Tag className="h-16 w-16" />
              </div>
            )}
            {deal.discount_percentage != null && deal.discount_percentage > 0 && (
              <Badge className="absolute left-4 top-4 bg-deal-hot text-white border-0 font-bold text-sm shadow-lg px-3 py-1">
                {Math.round(deal.discount_percentage)}% OFF
              </Badge>
            )}
              </div>

              {/* Info */}
              <div className="flex flex-col">
            {/* Store & Category & Share */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {deal.stores && (
                  <div className="flex items-center gap-2">
                    {deal.stores.logo_url && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary border border-border">
                        <img src={deal.stores.logo_url} alt={deal.stores.name} className="h-4 w-4 rounded object-contain" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{deal.stores.name}</span>
                  </div>
                )}
                {deal.categories && (
                  <Badge variant="outline" className="text-xs">{deal.categories.name}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <WatchDealButton dealId={deal.id} currentPrice={deal.discounted_price} />
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={shareDeal} aria-label="Share deal">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h1 className="font-display text-2xl lg:text-3xl font-bold mb-3">{deal.title}</h1>

            {deal.description && (
              <p className="text-muted-foreground mb-4 leading-relaxed">{deal.description}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              {deal.discounted_price != null && (
                <span className="font-display text-3xl font-bold text-deal-save">
                  ₹{deal.discounted_price.toLocaleString("en-IN")}
                </span>
              )}
              {deal.original_price != null && deal.discounted_price != null && (
                <span className="text-lg text-muted-foreground line-through">
                  ₹{deal.original_price.toLocaleString("en-IN")}
                </span>
              )}
              {savings != null && savings > 0 && (
                <Badge variant="secondary" className="text-xs bg-deal-save/10 text-deal-save">
                  Save ₹{savings.toLocaleString("en-IN")}
                </Badge>
              )}
            </div>

            {/* Voting + Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <DealVoteButtons
                dealId={deal.id}
                initialCount={Number((deal as any).upvote_count || 0)}
                initialUpvoted={Boolean((deal as any).user_has_upvoted)}
              />
              {deal.cashback_percentage != null && deal.cashback_percentage > 0 && (
                <Badge variant="secondary" className="bg-deal-cashback/10 text-deal-cashback border-deal-cashback/20">
                  <Percent className="mr-1 h-3.5 w-3.5" />
                  {deal.cashback_percentage}% Cashback
                </Badge>
              )}
              <Badge variant="outline" className="border-primary/20 text-muted-foreground">
                <Clock className="mr-1 h-3.5 w-3.5" />
                {updatedText}
              </Badge>
            </div>

            {/* Coupon */}
            {deal.coupon_code && (
              <div className="flex items-center gap-2 mb-6 p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                <span className="font-mono font-semibold tracking-wider text-sm flex-1">{deal.coupon_code}</span>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={copyCoupon}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            )}

            {/* CTA */}
            {!isMobile && (
              <Button
                size="lg"
                className="w-full gap-2 font-bold text-base mt-auto transition-transform hover:scale-[1.02]"
                onClick={() => trackAndOpen(deal.id, deal.affiliate_link)}
              >
                Get This Deal
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
              </div>
            </div>

            <BuyScoreCard input={buyScoreInput} />

            <PriceSummaryCards
              averagePrice={priceSummary.averagePrice}
              lowestPrice={priceSummary.lowestPrice}
              highestPrice={priceSummary.highestPrice}
            />

            <PriceHistoryChart history={history} currentPrice={currentPrice || null} />
          </div>

          <aside className="xl:sticky xl:top-24">
            <PriceComparisonPanel
              comparison={priceComparison}
              isLoading={isComparisonLoading}
              onViewDeal={openComparisonDeal}
            />
          </aside>
        </div>

        {/* Related Deals */}
        {related && related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold mb-6">Related Deals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((d) => (
                <DealCard key={d.id} deal={d as any} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile CTA */}
      {isMobile && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg px-5 py-3 shadow-lg">
          <Button
            size="lg"
            className="w-full gap-2 font-bold text-base"
            onClick={() => trackAndOpen(deal.id, deal.affiliate_link)}
          >
            Get This Deal
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      )}
    </MainLayout>
  );
}

