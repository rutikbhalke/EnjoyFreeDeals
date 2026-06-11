import { useMemo } from "react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingDown } from "lucide-react";
import type { PriceHistoryPoint } from "@/hooks/usePriceHistory";

interface Props {
  history: PriceHistoryPoint[];
  currentPrice: number | null;
}

export default function PriceHistoryChart({ history, currentPrice }: Props) {
  const chartData = useMemo(
    () =>
      history
        .filter((point) => Number.isFinite(Number(point.price)) && Number(point.price) > 0)
        .map((point) => ({
          date: format(new Date(point.recorded_at || point.date || Date.now()), "dd MMM"),
          price: Number(point.price),
          platform: point.platform || "Store",
        })),
    [history],
  );

  const lowestEver = useMemo(
    () => (chartData.length ? Math.min(...chartData.map((point) => point.price)) : null),
    [chartData],
  );

  const isLowest = lowestEver != null && currentPrice != null && currentPrice <= lowestEver;

  if (!chartData.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Price History</h3>
          <p className="text-sm text-muted-foreground">Track this deal price over time</p>
        </div>
        {isLowest && (
          <Badge className="bg-deal-save text-white border-0 gap-1">
            <TrendingDown className="h-3.5 w-3.5" />
            Lowest Price Ever
          </Badge>
        )}
      </div>
      <div className="h-52 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `Rs.${Number(value).toLocaleString("en-IN")}`}
              width={72}
            />
            <Tooltip
              formatter={(value: number) => [`Rs.${Number(value).toLocaleString("en-IN")}`, "Price"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                fontSize: 12,
              }}
            />
            {lowestEver != null && (
              <ReferenceLine
                y={lowestEver}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            )}
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ r: 4, fill: "hsl(var(--primary))" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
