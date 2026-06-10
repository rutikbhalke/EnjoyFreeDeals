import { BadgeCheck } from "lucide-react";

export default function LowestPriceBadge({ label = "Lowest Price" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
      <BadgeCheck className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
