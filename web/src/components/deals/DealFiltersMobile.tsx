import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import DealFilters from "./DealFilters";
import type { DealFilters as DealFiltersType } from "@/hooks/useFilteredDeals";

interface Props {
  filters: DealFiltersType;
  setFilters: (updated: Partial<DealFiltersType>) => void;
  clearFilters: () => void;
  activeCount: number;
}

export default function DealFiltersMobile({ filters, setFilters, clearFilters, activeCount }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 lg:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <DealFilters filters={filters} setFilters={setFilters} clearFilters={clearFilters} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
