import { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL } from "@/components/SEO";
import BlogCard from "@/components/blog/BlogCard";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, X, Laptop } from "lucide-react";

const CATEGORIES = [
  "All",
  "Software Deals",
  "GST Billing & POS",
  "CRM & ERP",
  "Healthcare & Labs",
  "Education",
  "Retail & Services",
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: posts, isLoading } = useBlogPosts(activeCategory === "All" ? undefined : (activeCategory === "Software Deals" ? "Software Deals" : undefined));

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    let list = posts;

    if (activeCategory !== "All" && activeCategory !== "Software Deals") {
      const catLower = activeCategory.toLowerCase();
      list = list.filter((p) => {
        const text = `${p.title} ${p.excerpt || ""} ${p.category || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
        if (catLower.includes("gst")) return text.includes("gst") || text.includes("billing") || text.includes("pos");
        if (catLower.includes("crm")) return text.includes("crm") || text.includes("erp");
        if (catLower.includes("healthcare")) return text.includes("lab") || text.includes("opd") || text.includes("clinic") || text.includes("hospital");
        if (catLower.includes("education")) return text.includes("edu") || text.includes("school") || text.includes("academy") || text.includes("mcq");
        if (catLower.includes("retail")) return text.includes("retail") || text.includes("silai") || text.includes("garage") || text.includes("catering") || text.includes("lodge");
        return p.category === activeCategory;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [posts, activeCategory, searchQuery]);

  const jsonLd: Record<string, any>[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "EnjoyFreeDeals Blog & Software Offers",
      description: "BizFlow software products, GST billing offers, CRM, ERP, and deal guides.",
      url: `${SITE_URL}/blog`,
      publisher: {
        "@type": "Organization",
        name: "EnjoyFreeDeals",
        url: SITE_URL,
      },
    },
    ...(filteredPosts && filteredPosts.length > 0 ? [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Blog Posts & Software Deals",
      numberOfItems: filteredPosts.length,
      itemListElement: filteredPosts.slice(0, 10).map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/blog/${post.slug}`,
        name: post.title,
      })),
    }] : []),
  ];

  return (
    <MainLayout>
      <SEO
        title="Software Deals & Blog — Free Trials & Coupon Guides"
        description="Explore 48+ BizFlow software products, GST billing tools, CRM, ERP, and money-saving deal guides with free trials & demos."
        canonical={`${SITE_URL}/blog`}
        jsonLd={jsonLd}
      />
      <div className="container mx-auto px-5 py-8">
        {/* Hero Header */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-8 text-white shadow-2xl border border-indigo-500/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Official Software Offers & Free Demos</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Software Deals & Deal Guides
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Discover 40+ official BizFlow business software products for Indian SMEs — GST Billing, POS, CRM, ERP, Clinic & Academy Management with Free 14-Day Trials.
            </p>

            {/* Search Input Bar */}
            <div className="relative pt-2 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search software (e.g. GST Billing, CRM, Clinic, EduFlow, Barcode)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-6 text-base rounded-2xl bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-slate-400 focus:bg-white/15 focus:border-indigo-400 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Tabs & Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full transition-all text-xs ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:border-primary/50"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 self-end sm:self-center">
            <Laptop className="h-4 w-4 text-primary" />
            <span>Showing {filteredPosts.length} Deals & Guides</span>
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden bg-card">
                <Skeleton className="aspect-[16/9] w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts && filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border p-8">
            <Badge variant="outline" className="mb-3">No matching deals</Badge>
            <p className="text-lg font-display font-semibold mb-1">No deals or posts found</p>
            <p className="text-sm text-muted-foreground mb-4">Try clearing your search query or switching categories.</p>
            <Button
              variant="outline"
              onClick={() => {
                setActiveCategory("All");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
