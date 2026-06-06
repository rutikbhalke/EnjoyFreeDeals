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
      history.map((p) => ({
        date: format(new Date(p.recorded_at), "dd MMM"),
        price: Number(p.price),
      })),
    [history],
  );

  const lowestEver = useMemo(
    () => (history.length ? Math.min(...history.map((p) => Number(p.price))) : null),
    [history],
  );

  const isLowest = lowestEver != null && currentPrice != null && currentPrice <= lowestEver;

  if (chartData.length < 2) return null;

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold">Price History</h3>
        {isLowest && (
          <Badge className="bg-deal-save text-white border-0 gap-1">
            <TrendingDown className="h-3.5 w-3.5" />
            Lowest Price Ever
          </Badge>
        )}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `₹${v}`}
              width={60}
            />
            <Tooltip
              formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Price"]}
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
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--primary))" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
