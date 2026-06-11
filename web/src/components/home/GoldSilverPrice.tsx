import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceDetail {
  label: string;
  purity: string;
  price: string;
  unit: string;
  changePercent: number;
  isUp: boolean;
}

export default function GoldSilverPrice() {
  const [prices, setPrices] = useState<PriceDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data, easily replaced by fetch() to API
    const timer = setTimeout(() => {
      setPrices([
        {
          label: "Gold 24K",
          purity: "99.9% Pure",
          price: "₹72,480",
          unit: "per 10g",
          changePercent: 0.45,
          isUp: true,
        },
        {
          label: "Gold 22K",
          purity: "91.6% Pure",
          price: "₹66,440",
          unit: "per 10g",
          changePercent: 0.38,
          isUp: true,
        },
        {
          label: "Silver 999",
          purity: "99.9% Pure",
          price: "₹91,500",
          unit: "per 1kg",
          changePercent: -0.22,
          isUp: false,
        },
      ]);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="container py-6 px-5">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="h-5 w-5 text-amber-500" />
        <h2 className="font-display text-xl font-bold">Commodity Rates Today</h2>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">Live Market Prices</span>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-28" />
              </Card>
            ))
          : prices.map((item) => (
              <Card key={item.label} className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                  <div>
                    <CardTitle className="text-base font-bold font-display">{item.label}</CardTitle>
                    <span className="text-[10px] text-muted-foreground font-medium">{item.purity}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.isUp
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 border border-red-500/20"
                    }`}
                  >
                    {item.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {item.isUp ? "+" : ""}
                    {item.changePercent}%
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-1">
                  <div className="font-display text-2xl font-bold text-foreground">
                    {item.price}
                  </div>
                  <span className="text-xs text-muted-foreground">{item.unit}</span>
                </CardContent>
              </Card>
            ))}
      </div>
    </section>
  );
}
