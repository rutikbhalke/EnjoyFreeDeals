import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL } from "@/components/SEO";
import { useCategories } from "@/hooks/useCategories";
import {
  Laptop, Shirt, UtensilsCrossed, Plane, Heart, Home, Clapperboard, Code, Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Laptop, Shirt, UtensilsCrossed, Plane, Heart, Home, Clapperboard, Code,
};

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();

  return (
    <MainLayout>
      <SEO title="Categories" description="Explore deal categories on EnjoyFreeDeals — electronics, fashion, food, travel, health & more." canonical={`${SITE_URL}/categories`} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">All Categories</h1>
          <p className="text-muted-foreground mt-1">Find the best deals by category</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {categories?.map((cat) => {
              const Icon = (cat.icon && iconMap[cat.icon]) || Tag;
              return (
                <Link
                  key={cat.id}
                  to={`/deals?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-sm text-center group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground text-center line-clamp-2">{cat.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
