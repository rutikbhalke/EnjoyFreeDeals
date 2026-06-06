import { useState } from "react";
import { Link } from "react-router-dom";
import { Store as StoreIcon, Percent, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL } from "@/components/SEO";
import { useStores } from "@/hooks/useStores";

export default function StoresPage() {
  const { data: stores, isLoading } = useStores();
  const [search, setSearch] = useState("");

  const filtered = stores?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <SEO
        title="Stores"
        description="Browse all partner stores on EnjoyFreeDeals and find exclusive cashback deals, coupons and discounts."
        canonical={`${SITE_URL}/stores`}
        jsonLd={filtered && filtered.length > 0 ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "All Stores",
          numberOfItems: filtered.length,
          itemListElement: filtered.slice(0, 10).map((store, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/deals?store=${store.slug}`,
            name: store.name,
          })),
        } : undefined}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">All Stores</h1>
            <p className="text-muted-foreground mt-1">Browse deals from your favourite stores</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-24 w-24 rounded-2xl" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5">
            {filtered?.map((store) => (
              <Link
                key={store.id}
                to={`/deals?store=${store.slug}`}
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-card border border-border shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="h-12 w-12 object-contain" />
                  ) : (
                    <StoreIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-display font-semibold text-xs text-center group-hover:text-primary transition-colors">
                  {store.name}
                </h3>
                {store.cashback_percentage != null && Number(store.cashback_percentage) > 0 && (
                  <Badge variant="secondary" className="text-[10px] bg-deal-cashback/10 text-deal-cashback border-deal-cashback/20">
                    <Percent className="mr-0.5 h-3 w-3" />
                    Up to {store.cashback_percentage}% Cashback
                  </Badge>
                )}
                {store.description && (
                  <p className="text-[10px] text-muted-foreground text-center line-clamp-2">{store.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
