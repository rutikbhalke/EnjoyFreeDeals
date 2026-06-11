import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Laptop, Shirt, UtensilsCrossed, Plane, Heart, Home, Clapperboard, Code, Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Laptop, Shirt, UtensilsCrossed, Plane, Heart, Home, Clapperboard, Code,
};

export default function CategoryLinks() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section className="container py-8 px-5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Shop by Category</h2>
        <Link to="/categories" className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-14 w-14 md:h-16 md:w-16 rounded-xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))
          : categories?.map((cat) => {
              const Icon = (cat.icon && iconMap[cat.icon]) || Tag;
              return (
                <Link
                  key={cat.id}
                  to={`/deals?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2.5 cursor-pointer group"
                >
                  <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-primary/5 border border-primary/10 transition-all duration-300 group-hover:bg-primary/15 group-hover:border-primary/25 group-hover:-translate-y-1 group-hover:shadow-md">
                    <Icon className="h-6 w-6 md:h-7 md:w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground text-center group-hover:text-foreground transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
