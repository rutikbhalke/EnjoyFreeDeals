import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL } from "@/components/SEO";
import { useCategories } from "@/hooks/useCategories";
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

interface FallbackCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  dealCount: number;
  description: string;
}

const FALLBACK_CATEGORIES: FallbackCategory[] = [
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    icon: "Electronics",
    dealCount: 142,
    description: "Laptops, audio gears, cameras, smart wearables & accessories",
  },
  {
    id: "fashion",
    name: "Fashion",
    slug: "fashion",
    icon: "Fashion",
    dealCount: 98,
    description: "Men, women & kids clothing, footwear, watches & sunglasses",
  },
  {
    id: "grocery",
    name: "Grocery",
    slug: "grocery",
    icon: "Grocery",
    dealCount: 45,
    description: "Daily essentials, gourmet food, health drinks & snacks",
  },
  {
    id: "beauty",
    name: "Beauty",
    slug: "beauty",
    icon: "Beauty",
    dealCount: 60,
    description: "Cosmetics, skin care kits, hair care & luxury fragrances",
  },
  {
    id: "home",
    name: "Home",
    slug: "home",
    icon: "Home",
    dealCount: 52,
    description: "Home decor, smart furniture, kitchen utensils & bedsheets",
  },
  {
    id: "mobiles",
    name: "Mobiles",
    slug: "mobiles",
    icon: "Mobiles",
    dealCount: 34,
    description: "Latest 5G smartphones, chargers, cases & screen protectors",
  },
  {
    id: "appliances",
    name: "Appliances",
    slug: "appliances",
    icon: "Appliances",
    dealCount: 27,
    description: "Smart TVs, refrigerators, washing machines & air conditioners",
  },
  {
    id: "books",
    name: "Books",
    slug: "books",
    icon: "Books",
    dealCount: 18,
    description: "Bestselling novels, educational resources, audiobooks & comics",
  },
  {
    id: "toys",
    name: "Toys",
    slug: "toys",
    icon: "Toys",
    dealCount: 22,
    description: "Educational puzzles, outdoor games, action figures & board games",
  },
];

export default function CategoriesPage() {
  const { data: apiCategories, isLoading } = useCategories();

  // Combine or fall back to pre-configured list
  const categoriesList = useCategoriesList(apiCategories);

  return (
    <MainLayout>
      <SEO title="Categories" description="Explore deal categories on EnjoyFreeDeals — electronics, fashion, food, travel, health & more." canonical={`${SITE_URL}/categories`} />
      <div className="container mx-auto px-5 py-8">
        <div className="mb-8 text-center md:text-left">
          <h1 className="font-display text-3xl font-bold">All Categories</h1>
          <p className="text-muted-foreground mt-1 text-sm">Find the best prices and active deals by category</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categoriesList.map((cat) => {
              const Icon = iconMap[cat.name] || Tag;
              return (
                <Link
                  key={cat.id}
                  to={`/deals?category=${cat.slug}`}
                  className="group flex flex-col items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {cat.description || "Browse the latest discounts and deals in this section."}
                      </p>
                    </div>
                  </div>

                  <Badge variant="secondary" className="mt-4 bg-primary/5 text-primary border-primary/10 px-3 py-0.5 text-xs font-semibold">
                    {cat.dealCount} active deals
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// Hook to format / map database categories to fallback defaults
function useCategoriesList(apiCats: any[] | undefined) {
  if (!apiCats || apiCats.length === 0) {
    return FALLBACK_CATEGORIES;
  }

  // If we have API data, we make sure the 9 requested categories are present
  // and merge dealCount stats where matching
  const mapped = FALLBACK_CATEGORIES.map((fallback) => {
    const matched = apiCats.find(
      (ac) =>
        ac.name?.toLowerCase() === fallback.name.toLowerCase() ||
        ac.slug?.toLowerCase() === fallback.slug.toLowerCase()
    );

    return {
      id: matched?.id || fallback.id,
      name: fallback.name,
      slug: matched?.slug || fallback.slug,
      description: matched?.description || fallback.description,
      dealCount: matched?.dealCount || matched?.deal_count || fallback.dealCount,
    };
  });

  return mapped;
}
