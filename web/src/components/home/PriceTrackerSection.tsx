import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Clock3, ExternalLink, History, IndianRupee, Search, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackPrice, TrackPriceResult } from "@/lib/api";
import { cn } from "@/lib/utils";

const platforms = [
  "Amazon Price History",
  "Flipkart Price History",
  "Myntra Price History",
  "Ajio Price History",
  "Croma Price History",
  "TataCliq Price History",
];

export default function PriceTrackerSection() {
  const [productUrl, setProductUrl] = useState("");
  const [result, setResult] = useState<TrackPriceResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUrl = productUrl.trim();
    if (!trimmedUrl) {
      setError("Paste a product link to start tracking.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      setResult(await trackPrice(trimmedUrl));
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Price tracking failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="border-y border-border/70 bg-secondary/25">
      <div className="container px-5 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div className="space-y-7">
            <div className="max-w-2xl space-y-4">
              <Badge variant="outline" className="gap-2 border-primary/30 bg-background text-primary">
                <History className="h-3.5 w-3.5" />
                Web price tracker
              </Badge>
              <h2 className="font-display text-3xl font-bold leading-tight md:text-5xl">
                Never overpay again, because prices have a past!
              </h2>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Track price history, compare prices, and buy at the right moment.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-3 rounded-lg border border-border bg-background p-2 shadow-sm sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                  placeholder="Paste Amazon / Flipkart / Myntra / Ajio product link"
                  className="h-12 border-0 pl-10 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 gap-2 px-6" disabled={isLoading}>
                <BarChart3 className="h-4 w-4" />
                {isLoading ? "Tracking..." : "Track Price"}
              </Button>
            </form>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {platforms.map((platform) => (
                <div key={platform} className="flex min-h-16 items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 shadow-sm">
                  <ShoppingBag className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-semibold">{platform}</span>
                </div>
              ))}
            </div>
          </div>

          <ResultPanel result={result} isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
}

function ResultPanel({ result, isLoading }: { result: TrackPriceResult | null; isLoading: boolean }) {
  const chartData = useMemo(() => {
    return (result?.priceHistory || []).map((point) => ({
      date: point.checkedAt ? new Date(point.checkedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Now",
      price: point.price,
    }));
  }, [result]);

  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-primary/30 bg-background/80 p-6">
        <div className="flex h-full min-h-[300px] flex-col justify-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock3 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Price memory starts here</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Paste a product link and EnjoyFreeDeals will check existing backend deal and price history records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-background p-5 shadow-sm", isLoading && "opacity-70")}>
      <div className="mb-5 flex items-start gap-3">
        {result.imageUrl ? (
          <img src={result.imageUrl} alt={result.title || result.storeName} className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-primary">
            <ShoppingBag className="h-7 w-7" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Badge variant="secondary">{result.storeName || "Store"}</Badge>
          <h3 className="mt-2 line-clamp-2 font-semibold">{result.title || result.message || "Tracking started"}</h3>
        </div>
      </div>

      {result.trackingStarted ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm font-medium text-primary">
          {result.message || "Tracking started. Price data will appear after the next fetch."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Current known price" value={result.currentPrice} icon={<IndianRupee className="h-4 w-4" />} />
            <Metric label="Lowest price" value={result.lowestPrice} icon={<TrendingDown className="h-4 w-4" />} />
            <Metric label="Highest price" value={result.highestPrice} icon={<TrendingUp className="h-4 w-4" />} />
            <Metric label="Average price" value={result.averagePrice} icon={<BarChart3 className="h-4 w-4" />} />
          </div>

          {result.bestDeal && (
            <a
              href={result.bestDeal.productUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm"
            >
              <span>
                <span className="block font-semibold text-primary">Best available deal</span>
                <span className="text-muted-foreground">{result.bestDeal.storeName} at {formatPrice(result.bestDeal.dealPrice)}</span>
              </span>
              <ExternalLink className="h-4 w-4 text-primary" />
            </a>
          )}

          <div className="mt-5 h-40">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 0, right: 6, top: 8, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={46} />
                  <Tooltip formatter={(value) => formatPrice(Number(value))} />
                  <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.16)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                Price history list/chart will appear when backend records exist.
              </div>
            )}
          </div>

          {result.priceHistory.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.priceHistory.slice(-4).reverse().map((point, index) => (
                <div key={`${point.checkedAt}-${index}`} className="flex justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                  <span>{point.checkedAt ? new Date(point.checkedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Checked"}</span>
                  <span className="font-semibold">{formatPrice(point.price)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number | null; icon: ReactNode }) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-3">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className="text-lg font-bold">{formatPrice(value)}</div>
      </CardContent>
    </Card>
  );
}

function formatPrice(value: number | null | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Not available";
  return `Rs. ${numeric.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
