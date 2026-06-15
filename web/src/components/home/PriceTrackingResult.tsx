import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  BadgeCheck,
  BarChart3,
  CalendarClock,
  ExternalLink,
  IndianRupee,
  Layers3,
  SearchCheck,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiPost, BackendDeal, TrackPriceResult } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getUserId, isLoggedIn } from "@/lib/auth";
import { Link } from "react-router-dom";

type Props = {
  result: TrackPriceResult | null;
  isLoading: boolean;
};

const RANGE_OPTIONS = [
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "6M", days: 180 },
  { key: "1Y", days: 365 },
] as const;

export default function PriceTrackingResult({ result, isLoading }: Props) {
  const normalized = useMemo(() => normalizeResult(result), [result]);

  if (!normalized) {
    return null;
  }

  if (!hasValidPriceData(normalized)) {
    return <PendingTrackingState result={normalized} isLoading={isLoading} />;
  }

  return (
    <section className={cn("container px-5 pb-12", isLoading && "opacity-90")}>
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_minmax(0,0.95fr)]">
          <ProductImageGallery images={normalized.images} title={normalized.title} />
          <ProductSummary result={normalized} />
          <ComparePricesCard result={normalized} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
          <PriceHistoryChart result={normalized} />
          <GoodTimeToBuyCard result={normalized} />
        </div>

        <PriceStatsCards result={normalized} />
        <RelatedDealsSection deals={normalized.relatedDeals || []} currency={normalized.currency} />
      </div>
    </section>
  );
}

export function PendingTrackingState({ result, isLoading }: { result: TrackPriceResult; isLoading: boolean }) {
  return (
    <section className={cn("container px-5 pb-12", isLoading && "opacity-90")}>
      <Card className="mx-auto max-w-3xl rounded-xl border-border bg-white">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-5 text-center sm:flex-row sm:text-left">
            <div className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 sm:mx-0">
              <SearchCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="text-2xl font-bold">Tracking started</h2>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>
                </div>
                <p className="text-muted-foreground">Price data will appear after the next fetch.</p>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-secondary/20 p-4 text-sm sm:grid-cols-2">
                <InfoLine icon={<Tag className="h-4 w-4" />} label="Store" value={result.storeName || "Detecting store"} />
                <InfoLine icon={<CalendarClock className="h-4 w-4" />} label="Status" value="Pending" />
                {result.productUrl && (
                  <div className="sm:col-span-2">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Product URL</div>
                    <div className="mt-1 break-all font-medium text-foreground">{result.productUrl}</div>
                  </div>
                )}
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                We are checking backend deal records and price history. We will show product image, price comparison,
                graph, and buy recommendation once backend records are available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function ProductImageGallery({ images, title }: { images: string[]; title: string }) {
  const normalizedImages = useMemo(() => uniqueStrings(images).filter(isHttpUrl), [images]);
  const [active, setActive] = useState(normalizedImages[0] || "");

  useEffect(() => {
    setActive(normalizedImages[0] || "");
  }, [normalizedImages]);

  const current = active || normalizedImages[0] || "";

  return (
    <Card className="rounded-xl border-border bg-white">
      <CardContent className="space-y-4 p-4">
        <div className="overflow-hidden rounded-lg border border-border bg-secondary/30">
          {current ? (
            <img src={current} alt={title || "Product image"} className="aspect-square w-full object-contain bg-white" />
          ) : (
            <div className="flex aspect-square flex-col items-center justify-center gap-3 bg-secondary/30 px-6 text-center text-muted-foreground">
              <Layers3 className="h-10 w-10" />
              <span className="text-sm font-medium">Product image unavailable</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {(normalizedImages.length ? normalizedImages : [""]).map((image, index) => (
            <button
              key={`${image || "placeholder"}-${index}`}
              type="button"
              onClick={() => image && setActive(image)}
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background",
                image && active === image ? "border-primary ring-2 ring-primary/15" : "border-border"
              )}
            >
              {image ? (
                <img src={image} alt={`${title || "Product"} thumbnail ${index + 1}`} className="h-full w-full object-contain" />
              ) : (
                <Layers3 className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductSummary({ result }: { result: TrackPriceResult }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const saving = Number.isFinite(result.youSave || NaN) ? result.youSave || 0 : null;
  const hasCurrentPrice = isPositivePrice(result.currentPrice);
  const lowMatch = hasCurrentPrice && Boolean(result.isAllTimeLow);
  const checkedText = result.lastCheckedAt ? new Date(result.lastCheckedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not checked yet";
  const handleSetAlert = async () => {
    const userId = isLoggedIn() ? getUserId() : user?.id || null;
    if (!userId || !result.dealId || !Number.isFinite(Number(result.currentPrice ?? result.lowestPrice))) {
      toast({ title: "Price alert feature coming soon", description: "We could not create an alert from this tracking result yet." });
      return;
    }

    try {
      await apiPost("/api/price-alerts", {
        userId,
        dealId: result.dealId,
        targetPrice: Number(result.lowestPrice ?? result.currentPrice ?? 0)
      });
      toast({ title: "Price alert created", description: "We will watch this deal for price drops." });
    } catch (error) {
      toast({
        title: "Price alert feature coming soon",
        description: error instanceof Error ? error.message : "We could not create an alert from this result.",
      });
    }
  };

  return (
    <Card className="rounded-xl border-border bg-white">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{result.categoryName || "Other Deals"}</Badge>
          <Badge variant="outline">{result.storeName || "Store"}</Badge>
          {lowMatch && (
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
              <BadgeCheck className="mr-1 h-3.5 w-3.5" />
              All-time low
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold leading-tight">{result.title}</h1>
          {result.description && <p className="text-sm text-muted-foreground">{result.description}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-emerald-600">{formatCurrency(result.currentPrice, result.currency)}</span>
            {hasCurrentPrice && result.originalPrice != null && result.originalPrice > (result.currentPrice ?? 0) && (
              <span className="text-sm text-muted-foreground line-through">{formatCurrency(result.originalPrice, result.currency)}</span>
            )}
            {hasCurrentPrice && result.discountPercent != null && result.discountPercent > 0 && (
              <Badge className="bg-rose-500 text-white hover:bg-rose-500">{Math.round(result.discountPercent)}% OFF</Badge>
            )}
          </div>
          {hasCurrentPrice && saving != null && saving > 0 && <p className="text-sm text-emerald-700">You save {formatCurrency(saving, result.currency)}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SmallStat label="All-time low" value={formatTrackedPrice(result.lowestPrice, result.currency)} accent={lowMatch ? "emerald" : "default"} />
          <SmallStat label="30-day average" value={formatTrackedPrice(result.thirtyDayAverage ?? result.averagePrice, result.currency)} />
          <SmallStat label="Deal score" value={result.dealScore != null ? `${result.dealScore}/100` : "Not enough data"} />
        </div>

        <div className="flex flex-wrap gap-3">
          {isHttpUrl(result.productUrl) && (
            <Button asChild className="gap-2 bg-purple-600 hover:bg-purple-700">
              <a href={result.productUrl} target="_blank" rel="noreferrer">
                View Deal
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {result.dealId && (
            <Button variant="outline" className="gap-2" onClick={handleSetAlert}>
              Set Alert
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Separator />

        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <InfoLine icon={<CalendarClock className="h-4 w-4" />} label="Last checked" value={checkedText} />
          <InfoLine icon={<BarChart3 className="h-4 w-4" />} label="History days" value={result.historyDays ? `${result.historyDays}` : "Not enough data"} />
          <InfoLine icon={<TrendingDown className="h-4 w-4" />} label="Free price alerts" value="Create a free alert when prices drop." />
          <InfoLine icon={<Tag className="h-4 w-4" />} label="Recommendation" value={result.recommendation?.label || "Not enough data"} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ComparePricesCard({ result }: { result: TrackPriceResult }) {
  const stores = validStoreComparisons(result.storeComparisons || []);
  const lowest = stores.reduce((min, item) => {
    const price = Number(item.price || 0);
    if (!Number.isFinite(price)) return min;
    if (min == null || price < min.price) return { ...item, price };
    return min;
  }, null as null | { storeName: string; price: number; productUrl: string; isBest: boolean; difference: number; platformLogoUrl?: string | null });

  return (
    <Card className="rounded-xl border-border bg-white">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-lg">Compare Prices</CardTitle>
        <p className="text-sm text-muted-foreground">Same product · {stores.length} stores</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {stores.length > 0 ? (
          stores.map((store) => {
            const price = Number(store.price || 0);
            const diff = Math.max(0, Number(store.difference || 0));
            const isBest = Boolean(store.isBest) || (lowest ? price === lowest.price : false);
            const percent = lowest && Number.isFinite(lowest.price) && price >= 0
              ? Math.max(12, 100 - Math.min(88, Math.round(((price - lowest.price) / Math.max(1, lowest.price)) * 100)))
              : 100;

            return (
              <div key={`${store.storeName}-${store.productUrl}`} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{store.storeName}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(price, result.currency)}</div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {isBest && <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Best price</Badge>}
                    {!isBest && diff > 0 && <Badge variant="secondary">+{formatCurrency(diff, result.currency)}</Badge>}
                    <Button asChild size="sm" variant="outline">
                      <a href={store.productUrl} target="_blank" rel="noreferrer">Buy</a>
                    </Button>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", isBest ? "bg-emerald-500" : "bg-emerald-400/80")}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
            More store prices will appear after next fetch.
          </div>
        )}
        {stores.length <= 1 && stores.length > 0 && (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
            More store prices will appear after next fetch.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PriceHistoryChart({ result }: { result: TrackPriceResult }) {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["key"]>("3M");
  const chartData = useMemo(() => {
    const cutoffDays = RANGE_OPTIONS.find((option) => option.key === range)?.days || 90;
    const cutoff = Date.now() - cutoffDays * 24 * 60 * 60 * 1000;
    const points = (result.priceHistory || [])
      .map((point) => ({
        date: point.checkedAt || null,
        price: Number(point.price || 0),
      }))
      .filter((point) => isPositivePrice(point.price))
      .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
      .filter((point) => !point.date || new Date(point.date).getTime() >= cutoff);
    return points;
  }, [range, result.priceHistory]);

  return (
    <Card className="rounded-xl border-border bg-white">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Price History</CardTitle>
          <div className="flex gap-1 rounded-full border border-border bg-secondary/40 p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  range === option.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {option.key}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">All-time low {formatTrackedPrice(result.lowestPrice, result.currency)}</Badge>
          <Badge variant="secondary">All-time high {formatTrackedPrice(result.highestPrice, result.currency)}</Badge>
          <Badge variant="secondary">Current {formatTrackedPrice(result.currentPrice, result.currency)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chartData.length > 1 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => formatChartDate(value)} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value), result.currency)}
                  labelFormatter={(label) => formatChartDate(label)}
                />
                <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
            Price history will appear after more tracking data is collected.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GoodTimeToBuyCard({ result }: { result: TrackPriceResult }) {
  const recommendation = result.recommendation || { label: "Not enough data", reason: "Price history will appear after more tracking data is collected." };
  return (
    <Card className="rounded-xl border-border bg-white">
      <CardHeader>
        <CardTitle className="text-lg">Good time to buy?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn(
          "rounded-xl border p-4",
          recommendation.label === "Good time to buy"
            ? "border-emerald-500/20 bg-emerald-50 text-emerald-800"
            : recommendation.label === "Wait for price drop"
              ? "border-amber-500/20 bg-amber-50 text-amber-800"
              : "border-border bg-secondary/20 text-foreground"
        )}>
          <div className="font-semibold">{recommendation.label}</div>
          <p className="mt-1 text-sm">{recommendation.reason}</p>
        </div>

        <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
          {result.priceHistory.length < 2
            ? "Not enough price history to make a recommendation."
            : recommendation.label === "Good time to buy"
              ? "Current price is close to all-time low."
              : recommendation.label === "Wait for price drop"
                ? "Current price is above 30-day average."
                : "Price is in a normal range compared to recent history."}
        </div>
      </CardContent>
    </Card>
  );
}

export function PriceStatsCards({ result }: { result: TrackPriceResult }) {
  const drops = countPriceDrops(result.priceHistory || []);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Current price" value={formatTrackedPrice(result.currentPrice, result.currency)} />
      <StatCard label="Lowest price" value={formatTrackedPrice(result.lowestPrice, result.currency)} accent="emerald" />
      <StatCard label="Highest price" value={formatTrackedPrice(result.highestPrice, result.currency)} />
      <StatCard label="Average price" value={formatTrackedPrice(result.averagePrice, result.currency)} />
      <StatCard label="30-day average" value={formatTrackedPrice(result.thirtyDayAverage ?? result.averagePrice, result.currency)} />
      <StatCard label="Price drops" value={result.priceHistory.length > 0 ? `${drops}` : "Not available"} />
      <StatCard label="Last checked" value={result.lastCheckedAt ? new Date(result.lastCheckedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not checked yet"} />
    </div>
  );
}

export function RelatedDealsSection({ deals, currency = "INR" }: { deals: BackendDeal[]; currency?: string }) {
  if (!deals || deals.length === 0) return null;

  return (
    <Card className="rounded-xl border-border bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Related deals</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {deals.slice(0, 6).map((deal) => {
          const dealUrl = deal.productUrl || deal.dealUrl || deal.affiliateUrl || "";
          return (
            <div key={deal.id} className="rounded-lg border border-border p-4">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{deal.storeName || "Store"}</Badge>
                  <Badge variant="outline">{deal.categoryName || "Other Deals"}</Badge>
                </div>
                <h3 className="line-clamp-2 font-semibold">{deal.title || "Related deal"}</h3>
                <div className="text-lg font-bold text-emerald-600">{formatCurrency(deal.dealPrice ?? deal.discountedPrice ?? null, currency)}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Link to={`/deals/${deal.slug || deal.id}`}>View Deal</Link>
                </Button>
                {dealUrl && (
                  <Button asChild size="sm" variant="outline">
                    <a href={dealUrl} target="_blank" rel="noreferrer">Buy</a>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SmallStat({ label, value, accent = "default" }: { label: string; value: string; accent?: "default" | "emerald" }) {
  return (
    <div className={cn("rounded-lg border bg-secondary/20 p-3", accent === "emerald" && "border-emerald-500/20 bg-emerald-50")}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm font-semibold", accent === "emerald" && "text-emerald-700")}>{value}</div>
    </div>
  );
}

function StatCard({ label, value, accent = "default" }: { label: string; value: string; accent?: "default" | "emerald" }) {
  return (
    <Card className={cn("rounded-xl border-border bg-white", accent === "emerald" && "border-emerald-500/20")}>
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={cn("mt-2 text-lg font-bold", accent === "emerald" && "text-emerald-700")}>{value}</div>
      </CardContent>
    </Card>
  );
}

function InfoLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function formatCurrency(value: number | null | undefined, currency = "INR") {
  if (value === null || value === undefined || value === "") return "Not available";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Not available";
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${numeric.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatTrackedPrice(value: number | null | undefined, currency = "INR") {
  return isPositivePrice(value) ? formatCurrency(value, currency) : "Not available";
}

function isPositivePrice(value: number | null | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}

function validStoreComparisons(comparisons: TrackPriceResult["storeComparisons"]) {
  return (comparisons || []).filter((item) =>
    isPositivePrice(item.price) &&
    Boolean(String(item.storeName || "").trim()) &&
    isHttpUrl(item.productUrl)
  );
}

function hasValidPriceData(result: TrackPriceResult | null) {
  return Boolean(
    result &&
    result.status !== "tracking_started" &&
    isPositivePrice(result.currentPrice) &&
    String(result.title || "").trim() &&
    isHttpUrl(result.productUrl)
  );
}

function countPriceDrops(history: TrackPriceResult["priceHistory"]) {
  const points = [...(history || [])]
    .filter((point) => Number.isFinite(Number(point.price)))
    .map((point) => Number(point.price));
  let drops = 0;
  for (let index = 1; index < points.length; index += 1) {
    if (points[index] < points[index - 1]) drops += 1;
  }
  return drops;
}

function formatChartDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function isHttpUrl(value?: string | null) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function normalizeResult(result: TrackPriceResult | null): TrackPriceResult | null {
  if (!result) return null;
  return {
    ...result,
    images: uniqueStrings(result.images || [result.imageUrl]),
    priceHistory: (result.priceHistory || []).filter((point) => isPositivePrice(point.price)),
    storeComparisons: result.storeComparisons || [],
    relatedDeals: result.relatedDeals || [],
  };
}


