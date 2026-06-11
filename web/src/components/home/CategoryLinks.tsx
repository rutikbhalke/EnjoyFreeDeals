import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Laptop, Shirt, UtensilsCrossed, Heart, Home, Smartphone, Tv, BookOpen, Gamepad, Tag
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Electronics: Laptop,
  Fashion: Shirt,
  Grocery: UtensilsCrossed,
  Beauty: Heart,
  Home: Home,
  Mobiles: Smartphone,
  Appliances: Tv,
  Books: BookOpen,
  Toys: Gamepad,
};

const DEFAULT_CATEGORIES = [
  { id: "electronics", name: "Electronics", slug: "electronics" },
  { id: "fashion", name: "Fashion", slug: "fashion" },
  { id: "grocery", name: "Grocery", slug: "grocery" },
  { id: "beauty", name: "Beauty", slug: "beauty" },
  { id: "home", name: "Home", slug: "home" },
  { id: "mobiles", name: "Mobiles", slug: "mobiles" },
  { id: "appliances", name: "Appliances", slug: "appliances" },
  { id: "books", name: "Books", slug: "books" },
  { id: "toys", name: "Toys", slug: "toys" },
];

export default function CategoryLinks() {
  const { data: apiCategories, isLoading } = useCategories();

  // Map API categories to defaults, or use standard categories list
  const displayCategories = apiCategories && apiCategories.length > 0
    ? DEFAULT_CATEGORIES.map(fallback => {
        const match = apiCategories.find(
          c => c.name?.toLowerCase() === fallback.name.toLowerCase() || c.slug?.toLowerCase() === fallback.slug.toLowerCase()
        );
        return {
          id: match?.id || fallback.id,
          name: fallback.name,
          slug: match?.slug || fallback.slug,
        };
      })
    : DEFAULT_CATEGORIES;

  return (
    <section className="container py-8 px-5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Shop by Category</h2>
        <Link to="/categories" className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-14 w-14 md:h-16 md:w-16 rounded-xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))
          : displayCategories.map((cat) => {
              const Icon = iconMap[cat.name] || Tag;
              return (
                <Link
                  key={cat.id}
                  to={`/deals?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-primary/5 border border-primary/10 transition-all duration-300 group-hover:bg-primary/15 group-hover:border-primary/25 group-hover:-translate-y-1 group-hover:shadow-md">
                    <Icon className="h-6 w-6 md:h-7 md:w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground text-center group-hover:text-foreground transition-colors truncate w-full max-w-[80px]">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
