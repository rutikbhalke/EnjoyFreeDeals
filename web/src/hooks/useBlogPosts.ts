import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[];
  author_name: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_description: string | null;
}

export const EXPORTFLOW_BLOG_DEAL: BlogPost = {
  id: "exportflow-15-day-free-demo",
  title: "ExportFlow Export Management Software Deal: 15-Day Free Demo",
  slug: "exportflow-15-day-free-demo",
  excerpt: "Try ExportFlow for export invoices, shipment tracking, payments and reports with a free 15-day demo. Contact BizFlow India at 8888567870.",
  content: [
    "Try ExportFlow for export invoices, shipment tracking, payments and reports with a free 15-day demo. Contact BizFlow India at 8888567870.",
    "ExportFlow is an export management software deal for exporters who want GST invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations, and compliance reports in one workflow.",
    "Deal highlight: get a free 15-day demo before choosing a plan. Use the demo to test invoice creation, shipment tracking, payment follow-up, and export reports with your real workflow.",
    "Product link: https://exportflow.mywebz.in/",
    "Contact/demo: https://bizflowindia.cloud/",
    "Mobile: 8888567870",
    "This is listed as a software demo deal so buyers can evaluate the workflow before paying, not as a regular advertisement.",
  ].join("\n\n"),
  cover_image: "https://storage.googleapis.com/gpt-engineer-file-uploads/6PFzlUjLQ0ZD0L2f3zOhWk0VaY42/social-images/social-1759382293023-export.JPG",
  category: "Platform Guide",
  tags: ["exportflow", "export-management", "software-deal", "free-demo"],
  author_name: "BizFlow Team",
  status: "published",
  published_at: "2026-07-10T00:00:00.000Z",
  created_at: "2026-07-10T00:00:00.000Z",
  updated_at: "2026-07-10T00:00:00.000Z",
  meta_description: "ExportFlow export management software deal with a free 15-day demo. Manage invoices, shipments, payments and export reports. Contact 8888567870.",
};

export function useBlogPosts(category?: string) {
  return useQuery({
    queryKey: ["blog-posts", category],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts" as any)
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return withExportFlowDeal(data as unknown as BlogPost[], category);
    },
  });
}

export function useBlogPost(slug?: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      if (slug === EXPORTFLOW_BLOG_DEAL.slug) {
        return EXPORTFLOW_BLOG_DEAL;
      }

      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BlogPost | null;
    },
    enabled: !!slug,
  });
}

function withExportFlowDeal(posts: BlogPost[] = [], category?: string): BlogPost[] {
  const shouldInclude = !category || category === EXPORTFLOW_BLOG_DEAL.category;
  const withoutDuplicate = posts.filter((post) => post.slug !== EXPORTFLOW_BLOG_DEAL.slug);
  return shouldInclude ? [EXPORTFLOW_BLOG_DEAL, ...withoutDuplicate] : withoutDuplicate;
}

export function useAdminBlogPosts() {
  return useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as BlogPost[];
    },
  });
}
