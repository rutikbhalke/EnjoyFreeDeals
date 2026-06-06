import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/hooks/useCategories";
import { useStores } from "@/hooks/useStores";
import type { DealFilters } from "@/hooks/useFilteredDeals";

interface DealFiltersProps {
  filters: DealFilters;
  setFilters: (updated: Partial<DealFilters>) => void;
  clearFilters: () => void;
}

export default function DealFilters({ filters, setFilters, clearFilters }: DealFiltersProps) {
  const { data: categories } = useCategories();
  const { data: stores } = useStores();

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.stores.length > 0 ||
    filters.minPrice != null ||
    filters.maxPrice != null ||
    filters.search !== "";

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* Sort */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Sort By</Label>
        <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low → High</SelectItem>
            <SelectItem value="price-desc">Price: High → Low</SelectItem>
            <SelectItem value="discount">Biggest Discount</SelectItem>
            <SelectItem value="top-rated">Top Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">Categories</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories?.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={filters.categories.includes(cat.slug)}
                onCheckedChange={() => setFilters({ categories: toggleArray(filters.categories, cat.slug) })}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Stores */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">Stores</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {stores?.map((store) => (
            <label key={store.id} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={filters.stores.includes(store.slug)}
                onCheckedChange={() => setFilters({ stores: toggleArray(filters.stores, store.slug) })}
              />
              {store.logo_url && <img src={store.logo_url} alt="" className="h-4 w-4 rounded object-contain" />}
              {store.name}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">Price Range</Label>
        <Slider
          min={0}
          max={50000}
          step={500}
          value={[filters.minPrice ?? 0, filters.maxPrice ?? 50000]}
          onValueChange={([min, max]) =>
            setFilters({
              minPrice: min > 0 ? min : null,
              maxPrice: max < 50000 ? max : null,
            })
          }
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>₹{(filters.minPrice ?? 0).toLocaleString("en-IN")}</span>
          <span>₹{(filters.maxPrice ?? 50000).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );
}
