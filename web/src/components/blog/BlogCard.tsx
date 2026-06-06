import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import type { BlogPost } from "@/hooks/useBlogPosts";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/20"
    >
      <div className="aspect-[16/9] overflow-hidden bg-secondary">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-4xl font-display">
            📝
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {post.category && (
          <Badge variant="secondary" className="self-start mb-2 text-xs">
            {post.category}
          </Badge>
        )}
        <h3 className="font-display text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
          <Calendar className="h-3.5 w-3.5" />
          {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "Draft"}
          <span className="mx-1">·</span>
          <span>{post.author_name}</span>
        </div>
      </div>
    </Link>
  );
}
