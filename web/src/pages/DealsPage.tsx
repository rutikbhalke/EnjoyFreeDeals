import { useEffect, useRef, useCallback } from "react";
import { X, SearchX, Loader2, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import PullToRefresh from "@/components/ui/PullToRefresh";
import SEO, { SITE_URL } from "@/components/SEO";
import DealCard from "@/components/deals/DealCard";
import DealFilters from "@/components/deals/DealFilters";
import DealFiltersMobile from "@/components/deals/DealFiltersMobile";
import { useFilterParams, useFilteredDeals } from "@/hooks/useFilteredDeals";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { Link } from "react-router-dom";

export default function DealsPage() {
  const { filters, setFilters, clearFilters } = useFilterParams();
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useFilteredDeals(filters);
  const { trackSearch } = useActivityTracker();
  const lastTrackedSearch = useRef("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const deals = data?.pages.flat() ?? [];

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Track search queries
  useEffect(() => {
    if (filters.search && filters.search !== lastTrackedSearch.current) {
      lastTrackedSearch.current = filters.search;
      trackSearch(filters.search);
    }
  }, [filters.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount =
    filters.categories.length +
    filters.stores.length +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.search ? 1 : 0);

  const chipEntries: { label: string; remove: () => void }[] = [];
  filters.categories.forEach((c) =>
    chipEntries.push({ label: c, remove: () => setFilters({ categories: filters.categories.filter((x) => x !== c) }) })
  );
  filters.stores.forEach((s) =>
    chipEntries.push({ label: s, remove: () => setFilters({ stores: filters.stores.filter((x) => x !== s) }) })
  );
  if (filters.search)
    chipEntries.push({ label: `"${filters.search}"`, remove: () => setFilters({ search: "" }) });
  if (filters.minPrice != null || filters.maxPrice != null)
    chipEntries.push({
      label: `₹${filters.minPrice ?? 0} – ₹${filters.maxPrice ?? "50,000"}`,
      remove: () => setFilters({ minPrice: null, maxPrice: null }),
    });

  return (
    <MainLayout>
      <SEO
        title="All Deals"
        description="Browse the latest deals, coupons and cashback offers on EnjoyFreeDeals. Filter by store, category and price to save more."
        canonical={`${SITE_URL}/deals`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "All Deals",
            url: `${SITE_URL}/deals`,
            description: "Browse the latest deals, coupons and cashback offers.",
          },
          ...(deals.length > 0 ? [{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "All Deals",
            numberOfItems: deals.length,
            itemListElement: deals.slice(0, 10).map((deal: any, i: number) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}/deals/${deal.slug}`,
              name: deal.title,
            })),
          }] : []),
        ]}
      />
      <div className="container mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">All Deals</h1>
            {deals.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Showing {deals.length} deal{deals.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <DealFiltersMobile filters={filters} setFilters={setFilters} clearFilters={clearFilters} activeCount={activeCount} />
        </div>

        {/* Filter chips */}
        {chipEntries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {chipEntries.map((chip, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1 capitalize">
                {chip.label}
                <button onClick={chip.remove} className="ml-1 rounded-full p-0.5 hover:bg-muted min-h-[22px] min-w-[22px] flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
              <DealFilters filters={filters} setFilters={setFilters} clearFilters={clearFilters} />
            </div>
          </aside>

          {/* Grid */}
          <PullToRefresh onRefresh={refetch}>
            <main className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="aspect-[16/10] w-full animate-shimmer" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : deals.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {deals.map((deal) => (
                      <DealCard key={deal.id} deal={deal as any} />
                    ))}
                  </div>

                  {/* Infinite scroll sentinel */}
                  {hasNextPage && (
                    <div ref={sentinelRef} className="flex justify-center mt-8 py-4">
                      {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Loading more deals...</span>
                        </div>
                      )}
                    </div>
                  )}
                  {!hasNextPage && (
                    <div className="flex flex-col items-center text-center py-4 mt-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-3">
                        <PartyPopper className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">You've seen all deals!</p>
                      <Link to="/submit-deal" className="text-xs text-primary hover:underline mt-1">
                        Know a deal we're missing? Submit it →
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
                    <SearchX className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-display font-semibold mb-1">No deals found</p>
                  <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or browse all deals</p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </main>
          </PullToRefresh>
        </div>
      </div>
    </MainLayout>
  );
}
