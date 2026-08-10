import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Sparkles, Tag } from "lucide-react";
import { format } from "date-fns";
import type { BlogPost } from "@/hooks/useBlogPosts";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const offerText = post.offer || "Free 14-Day Trial";
  const isSoftwareDeal = post.category === "Software Deals" || post.tags?.includes("bizflow") || post.slug?.includes("-offer");

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-4xl font-display">
            📝
          </div>
        )}

        {/* Gradient Overlay for crisp text readabilty */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {post.category && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-foreground font-medium text-xs shadow-sm">
              {post.category}
            </Badge>
          )}

          {isSoftwareDeal && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 shadow-lg shadow-emerald-500/20 animate-pulse">
              🔥 {offerText}
            </Badge>
          )}
        </div>

        {/* Bottom Banner inside Image for Software Deals */}
        {isSoftwareDeal && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Special Offer
            </span>
            <span className="bg-primary/90 px-2.5 py-1 rounded-md text-primary-foreground font-bold">
              Free Trial / Demo
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold mb-2.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {post.excerpt}
          </p>
        )}

        {/* Tags list */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Card Footer with CTA */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "Draft"}</span>
          </div>

          <Button size="sm" variant="ghost" className="text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all rounded-lg gap-1 px-3">
            <span>Claim Offer</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
