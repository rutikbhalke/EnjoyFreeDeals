import { ArrowDown, ArrowUp, BarChart3 } from "lucide-react";

type PriceSummaryCardsProps = {
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
};

export default function PriceSummaryCards({ averagePrice, lowestPrice, highestPrice }: PriceSummaryCardsProps) {
  const cards = [
    {
      label: "Average Price",
      price: averagePrice,
      icon: BarChart3,
      className: "border-violet-200 bg-violet-50 text-violet-700",
    },
    {
      label: "Lowest Price",
      price: lowestPrice,
      icon: ArrowDown,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Highest Price",
      price: highestPrice,
      icon: ArrowUp,
      className: "border-orange-200 bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map(({ label, price, icon: Icon, className }) => (
        <div key={label} className={`rounded-2xl border p-4 shadow-sm ${className}`}>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/80">
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <p className="mt-1 break-words font-display text-2xl font-black">
            Rs.{Number(price || 0).toLocaleString("en-IN")}
          </p>
        </div>
      ))}
    </div>
  );
}
