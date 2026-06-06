import { useParams, Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL, SITE_NAME } from "@/components/SEO";
import BlogCard from "@/components/blog/BlogCard";
import { useBlogPost, useBlogPosts } from "@/hooks/useBlogPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug);
  const { data: allPosts } = useBlogPosts();

  const related = allPosts
    ?.filter((p) => p.slug !== slug && p.category === post?.category)
    .slice(0, 3);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-5 py-8 max-w-3xl space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="container mx-auto px-5 py-20 text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">This blog post may have been removed.</p>
          <Button asChild><Link to="/blog">Back to Blog</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.meta_description || post.excerpt,
      image: post.cover_image,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: { "@type": "Person", name: post.author_name },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        ...(post.category ? [{ "@type": "ListItem", position: 3, name: post.category, item: `${SITE_URL}/blog` }] : []),
        { "@type": "ListItem", position: post.category ? 4 : 3, name: post.title },
      ],
    },
  ];

  return (
    <MainLayout>
      <SEO
        title={post.title}
        description={post.meta_description || post.excerpt || undefined}
        ogImage={post.cover_image || undefined}
        ogType="article"
        canonical={`${SITE_URL}/blog/${post.slug}`}
        jsonLd={jsonLd}
      />
      <article className="container mx-auto px-5 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/blog" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />Blog
          </Link>
          {post.category && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground/70">{post.category}</span>
            </>
          )}
        </nav>

        {/* Cover */}
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full aspect-[16/9] object-cover rounded-xl mb-8"
          />
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {post.category && <Badge variant="secondary">{post.category}</Badge>}
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {post.published_at ? format(new Date(post.published_at), "MMMM d, yyyy") : "Draft"}
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            {post.author_name}
          </span>
        </div>

        <h1 className="font-display text-3xl lg:text-4xl font-bold mb-8">{post.title}</h1>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown>{post.content || ""}</ReactMarkdown>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs capitalize">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </article>

      {/* Related */}
      {related && related.length > 0 && (
        <section className="container mx-auto px-5 pb-12 max-w-5xl">
          <h2 className="font-display text-xl font-bold mb-6">Related Posts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </MainLayout>
  );
}
