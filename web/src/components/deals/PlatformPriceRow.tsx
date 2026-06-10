import { ExternalLink, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlatformPrice } from "@/lib/api";
import LowestPriceBadge from "./LowestPriceBadge";

type PlatformPriceRowProps = {
  price: PlatformPrice;
  onViewDeal: (url: string) => void;
};

export default function PlatformPriceRow({ price, onViewDeal }: PlatformPriceRowProps) {
  const delivery = price.delivery_charge && price.delivery_charge > 0
    ? `Delivery ₹${price.delivery_charge.toLocaleString("en-IN")}`
    : "Free delivery";

  return (
    <div className={`rounded-xl border p-3 transition-colors ${price.is_lowest_price ? "border-emerald-500 bg-emerald-50" : "border-border bg-card"}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white">
          {price.platform_logo_url ? (
            <img src={price.platform_logo_url} alt={price.platform} className="h-6 w-6 object-contain" />
          ) : (
            <span className="text-xs font-bold text-muted-foreground">{price.platform.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold leading-tight">{price.platform}</p>
            {price.is_lowest_price && <LowestPriceBadge label="Best Price" />}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700">₹{price.price.toLocaleString("en-IN")}</span>
            {price.original_price != null && price.original_price > price.price && (
              <span className="text-sm text-muted-foreground line-through">₹{price.original_price.toLocaleString("en-IN")}</span>
            )}
            {price.discount_percent != null && price.discount_percent > 0 && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {Math.round(price.discount_percent)}% OFF
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" />{delivery}</span>
            {price.coupon_code && <span className="font-semibold text-deal-hot">Coupon: {price.coupon_code}</span>}
            {price.rating != null && price.rating > 0 && <span>{price.rating.toFixed(1)} rating</span>}
          </div>
        </div>
        <Button
          size="sm"
          variant={price.is_lowest_price ? "default" : "outline"}
          className="shrink-0 gap-1"
          disabled={!price.is_available || !price.product_url}
          onClick={() => onViewDeal(price.product_url)}
        >
          {price.product_url ? "View" : "Link unavailable"}
          {price.product_url && <ExternalLink className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
