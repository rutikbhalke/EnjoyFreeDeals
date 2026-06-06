import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL } from "@/components/SEO";
import BlogCard from "@/components/blog/BlogCard";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const CATEGORIES = ["All", "Coupon Guides", "Shopping Tips", "Tech Deals", "Food & Dining", "Travel Tips", "Platform Guide"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: posts, isLoading } = useBlogPosts(activeCategory === "All" ? undefined : activeCategory);

  const jsonLd: Record<string, any>[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "EnjoyFreeDeals Blog",
      description: "Shopping tips, deal guides, and money-saving strategies from EnjoyFreeDeals.",
      url: `${SITE_URL}/blog`,
      publisher: {
        "@type": "Organization",
        name: "EnjoyFreeDeals",
        url: SITE_URL,
      },
    },
    ...(posts && posts.length > 0 ? [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Blog Posts",
      numberOfItems: posts.length,
      itemListElement: posts.slice(0, 10).map((post, i) => ({
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
        title="Blog — Shopping Tips & Deal Guides"
        description="Read expert shopping tips, coupon guides, and deal strategies. Save more with EnjoyFreeDeals blog."
        canonical={`${SITE_URL}/blog`}
        jsonLd={jsonLd}
      />
      <div className="container mx-auto px-5 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold">Blog</h1>
          </div>
          <p className="text-muted-foreground">Shopping tips, deal guides, and money-saving strategies.</p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <Skeleton className="aspect-[16/9] w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg font-display font-semibold mb-1">No posts yet</p>
            <p className="text-sm text-muted-foreground">Check back soon for new content.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
