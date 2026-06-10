import { useMemo, useState } from "react";
import { Clock, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUpdatedTime, type PriceComparison } from "@/lib/api";
import LowestPriceBadge from "./LowestPriceBadge";
import PlatformPriceRow from "./PlatformPriceRow";

type PriceComparisonPanelProps = {
  comparison?: PriceComparison | null;
  isLoading?: boolean;
  onViewDeal: (url: string) => void;
};

export default function PriceComparisonPanel({ comparison, isLoading, onViewDeal }: PriceComparisonPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const sortedPrices = useMemo(
    () => [...(comparison?.prices || [])].sort((a, b) => {
      if (a.is_lowest_price !== b.is_lowest_price) return a.is_lowest_price ? -1 : 1;
      if (a.is_available !== b.is_available) return a.is_available ? -1 : 1;
      return Number(a.price || 0) - Number(b.price || 0);
    }),
    [comparison?.prices]
  );
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <Skeleton className="mb-4 h-6 w-40" />
        <Skeleton className="mb-3 h-20 w-full rounded-xl" />
        <Skeleton className="mb-3 h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </section>
    );
  }

  if (!comparison || !comparison.prices.length) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-5 text-center shadow-sm">
        <SearchX className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h2 className="font-display text-lg font-bold">Compare Prices</h2>
        <p className="mt-1 text-sm text-muted-foreground">No price comparison available for this product yet.</p>
      </section>
    );
  }

  const updatedText = formatUpdatedTime(comparison.last_price_checked_at);
  const visiblePrices = showAll ? sortedPrices : sortedPrices.slice(0, 5);
  const hiddenCount = Math.max(0, sortedPrices.length - visiblePrices.length);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Compare Prices</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {updatedText}
          </p>
        </div>
        <LowestPriceBadge />
      </div>

      <div className="mb-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Best platform</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-black">{comparison.best_platform || "Store"}</p>
            <p className="text-sm text-white/80">{comparison.comparison_count} platform{comparison.comparison_count === 1 ? "" : "s"} checked</p>
          </div>
          <p className="text-2xl font-black">₹{comparison.lowest_price.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="space-y-3">
        {visiblePrices.map((price) => (
          <PlatformPriceRow
            key={`${price.platform}-${price.product_url}`}
            price={price}
            onViewDeal={onViewDeal}
          />
        ))}
        {hiddenCount > 0 && (
          <Button variant="outline" className="w-full" onClick={() => setShowAll(true)}>
            Show More Platforms ({hiddenCount})
          </Button>
        )}
      </div>
    </section>
  );
}
