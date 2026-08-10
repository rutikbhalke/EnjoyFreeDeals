import { useParams, Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL, SITE_NAME } from "@/components/SEO";
import BlogCard from "@/components/blog/BlogCard";
import { useBlogPost, useBlogPosts } from "@/hooks/useBlogPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, ExternalLink, PhoneCall, MessageSquare, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
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
          <Button asChild><Link to="/blog">Back to Blog & Software Deals</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const isSoftwareDeal = post.category === "Software Deals" || post.tags?.includes("bizflow") || post.slug?.includes("-offer");
  const offerText = post.offer || "Free 14-Day Trial";
  const dealUrl = post.deal_url || "https://bizflowindia.cloud/";
  const dealPhone = post.deal_phone || "8888567870";
  const whatsappUrl = `https://wa.me/918888567870?text=${encodeURIComponent(`Hi BizFlow Team! I want to claim the offer for ${post.title}. Please share demo details.`)}`;

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
      <article className="container mx-auto px-5 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/blog" className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Software Deals & Blog
          </Link>
          {post.category && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground/70">{post.category}</span>
            </>
          )}
        </nav>

        {/* Software Offer Callout Banner */}
        {isSoftwareDeal && (
          <div className="mb-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge className="bg-emerald-500 text-white font-bold text-xs px-3 py-1 animate-pulse">
                  🔥 ACTIVE SPECIAL SOFTWARE OFFER
                </Badge>
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>100% Verified BizFlow Deal</span>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-snug">
                  {post.title}
                </h2>
                <p className="text-emerald-100/80 text-sm sm:text-base">
                  Special Offer: <span className="font-bold text-white underline">{offerText}</span> (No Credit Card Required)
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 gap-2">
                  <a href={dealUrl} target="_blank" rel="noopener noreferrer">
                    <span>🚀 Claim Offer on BizFlow</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>

                <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold rounded-xl gap-2">
                  <a href={`tel:+91${dealPhone}`}>
                    <PhoneCall className="h-4 w-4 text-emerald-400" />
                    <span>Call Demo: {dealPhone}</span>
                  </a>
                </Button>

                <Button asChild size="lg" variant="outline" className="bg-emerald-600/30 hover:bg-emerald-600/50 text-white border-emerald-400/30 font-bold rounded-xl gap-2">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-4 w-4 text-emerald-300" />
                    <span>WhatsApp Setup</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cover Image */}
        {post.cover_image && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-border shadow-md aspect-[16/9] bg-muted">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Post Metadata */}
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
          {post.category && <Badge variant="secondary" className="font-semibold">{post.category}</Badge>}
          <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {post.published_at ? format(new Date(post.published_at), "MMMM d, yyyy") : "Draft"}
          </span>
          <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            {post.author_name}
          </span>
        </div>

        {/* Post Article Body */}
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary hover:prose-a:underline">
          <ReactMarkdown>{post.content || ""}</ReactMarkdown>
        </div>

        {/* Post Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs capitalize">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Bottom Conversion Banner for Software Deals */}
        {isSoftwareDeal && (
          <div className="mt-12 rounded-2xl bg-card border border-border p-6 sm:p-8 text-center space-y-4 shadow-lg">
            <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display">
              Ready to automate your business with {post.title}?
            </h3>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Get started today with a free 14-day trial or live walkthrough with our software specialists. Multi-language support available in English, Hindi, and Marathi.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild size="lg" className="font-bold gap-2 rounded-xl">
                <a href={dealUrl} target="_blank" rel="noopener noreferrer">
                  <span>Visit Official BizFlow Page</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-bold gap-2 rounded-xl">
                <a href={`tel:+91${dealPhone}`}>
                  <PhoneCall className="h-4 w-4 text-emerald-500" />
                  <span>Call +91 {dealPhone}</span>
                </a>
              </Button>
            </div>
          </div>
        )}
      </article>

      {/* Related Posts */}
      {related && related.length > 0 && (
        <section className="container mx-auto px-5 py-12 max-w-5xl border-t border-border mt-12">
          <h2 className="font-display text-2xl font-bold mb-6">Related Software Deals & Guides</h2>
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
