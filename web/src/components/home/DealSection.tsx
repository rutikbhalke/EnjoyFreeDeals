import { Link } from "react-router-dom";
import DealCard from "@/components/deals/DealCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { ReactNode } from "react";

interface DealSectionProps {
  title: string;
  icon?: ReactNode;
  deals: any[] | undefined;
  isLoading: boolean;
  viewAllLink?: string;
}

export default function DealSection({ title, icon, deals, isLoading, viewAllLink = "/deals" }: DealSectionProps) {
  if (!isLoading && (!deals || deals.length === 0)) return null;

  return (
    <section className="container py-8 px-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-display text-2xl font-bold">{title}</h2>
        </div>
        <Link to={viewAllLink} className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 group">
          View All <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="aspect-[16/10] w-full animate-shimmer" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              </div>
            ))
          : deals?.map((deal) => <DealCard key={deal.id} deal={deal} />)}
      </div>
    </section>
  );
}
