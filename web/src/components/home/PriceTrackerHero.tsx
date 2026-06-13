import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Search, BarChart3 } from "lucide-react";
import { FormEvent } from "react";

type Props = {
  productUrl: string;
  setProductUrl: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: string;
};

const platforms = [
  "Amazon Price History",
  "Flipkart Price History",
  "Myntra Price History",
  "Ajio Price History",
  "Croma Price History",
  "TataCliq Price History",
];

export default function PriceTrackerHero({ productUrl, setProductUrl, onSubmit, isLoading, error }: Props) {
  return (
    <section className="border-y border-border/70 bg-secondary/25">
      <div className="container px-5 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)]">
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <History className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">{platform}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
