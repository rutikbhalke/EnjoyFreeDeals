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
  title: "ExportFlow Software Offer: Free 15-Day Demo",
  slug: "exportflow-15-day-free-demo",
  excerpt: "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
  content: [
    "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
    "Deal type: Free 15-day demo offer.",
    "Use the demo to try GST export invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations, and reports with your real workflow.",
    "ExportFlow: https://exportflow.mywebz.in/",
    "Book demo: https://bizflowindia.cloud/",
    "Mobile: 8888567870",
  ].join("\n\n"),
  cover_image: "/exportflow-document-hub.png",
  category: "Software Deals",
  tags: ["exportflow", "export-management", "software-offer", "free-demo"],
  author_name: "BizFlow Team",
  status: "published",
  published_at: "2026-07-10T00:00:00.000Z",
  created_at: "2026-07-10T00:00:00.000Z",
  updated_at: "2026-07-10T00:00:00.000Z",
  meta_description: "ExportFlow software offer with a free 15-day demo. Manage export invoices, shipments, payments and reports. Demo booking: 8888567870.",
};

export const EDUFLOW_BLOG_DEAL: BlogPost = {
  id: "eduflow-education-management-software-offer",
  title: "EduFlow Education Management Software Offer: Free Trial",
  slug: "eduflow-education-management-software-offer",
  excerpt: "Try EduFlow for students, faculty, fees, attendance, hostel, library, transport, exams and placements. Free trial available.",
  content: [
    "Try EduFlow for students, faculty, fees, attendance, hostel, library, transport, exams and placements. Free trial available.",
    "Deal type: Free trial education ERP offer.",
    "EduFlow is an education management platform for schools, colleges, universities and institutes that need student records, faculty workflows, fee collection, attendance tracking, hostel, library, transport, exams, placements and reports in one system.",
    "Use the trial to check admissions, student dashboards, attendance, fee receipts, exam/result workflows and institute reports with your real education management process.",
    "EduFlow: https://eduflow.mywebz.in/",
  ].join("\n\n"),
  cover_image: "https://storage.googleapis.com/gpt-engineer-file-uploads/lAaVSYx4RVVmxIS64ld97TLZWug1/social-images/social-1760781174571-clg%20crm.JPG",
  category: "Software Deals",
  tags: ["eduflow", "education-management", "school-erp", "college-erp", "software-offer", "free-trial"],
  author_name: "BizFlow Team",
  status: "published",
  published_at: "2026-07-10T00:00:00.000Z",
  created_at: "2026-07-10T00:00:00.000Z",
  updated_at: "2026-07-10T00:00:00.000Z",
  meta_description: "EduFlow education management software offer with a free trial. Manage students, faculty, fees, attendance, exams, hostel, library, transport and placements.",
};

const STATIC_BLOG_DEALS = [EDUFLOW_BLOG_DEAL, EXPORTFLOW_BLOG_DEAL];

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
      return withStaticBlogDeals(data as unknown as BlogPost[], category);
    },
  });
}

export function useBlogPost(slug?: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const staticDeal = STATIC_BLOG_DEALS.find((deal) => deal.slug === slug);
      if (staticDeal) {
        return staticDeal;
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

function withStaticBlogDeals(posts: BlogPost[] = [], category?: string): BlogPost[] {
  const matchingStaticDeals = STATIC_BLOG_DEALS.filter((deal) => !category || category === deal.category);
  const staticSlugs = new Set(STATIC_BLOG_DEALS.map((deal) => deal.slug));
  const withoutDuplicate = posts.filter((post) => !staticSlugs.has(post.slug));
  return [...matchingStaticDeals, ...withoutDuplicate];
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
