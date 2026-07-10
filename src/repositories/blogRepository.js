const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "blog_posts";
const EXPORTFLOW_BLOG_DEAL = {
  blogId: "exportflow-15-day-free-demo",
  id: "exportflow-15-day-free-demo",
  title: "ExportFlow Software Offer: Free 15-Day Demo",
  slug: "exportflow-15-day-free-demo",
  image: "https://storage.googleapis.com/gpt-engineer-file-uploads/6PFzlUjLQ0ZD0L2f3zOhWk0VaY42/social-images/social-1759382293023-export.JPG",
  shortDescription: "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
  fullContent: [
    "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
    "Offer: free 15-day demo access for ExportFlow export management software.",
    "Use the demo to try GST export invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations, and reports with your real workflow.",
    "ExportFlow: https://exportflow.mywebz.in/",
    "Book demo: https://bizflowindia.cloud/",
    "Mobile: 8888567870"
  ].join("\n\n"),
  author: "BizFlow Team",
  category: "Platform Guide",
  tags: ["exportflow", "export-management", "software-offer", "free-demo"],
  isPublished: true,
  metaDescription: "ExportFlow software offer with a free 15-day demo. Manage export invoices, shipments, payments and reports. Demo booking: 8888567870.",
  publishedAt: "2026-07-10T00:00:00.000Z",
  createdAt: "2026-07-10T00:00:00.000Z",
  updatedAt: "2026-07-10T00:00:00.000Z"
};

async function listPublishedBlogs() {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  throwIfSupabaseError(error, TABLE);
  const blogs = (data || []).map(toApiBlog);
  const withoutDuplicate = blogs.filter((blog) => blog.slug !== EXPORTFLOW_BLOG_DEAL.slug);
  return [EXPORTFLOW_BLOG_DEAL, ...withoutDuplicate];
}

function toApiBlog(row) {
  return {
    blogId: row.id,
    id: row.id,
    title: row.title || "",
    slug: row.slug || "",
    image: row.cover_image || "",
    shortDescription: row.excerpt || "",
    fullContent: row.content || "",
    author: row.author_name || "BizFlow Team",
    category: row.category || "",
    tags: row.tags || [],
    isPublished: row.status === "published",
    metaDescription: row.meta_description || "",
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = { listPublishedBlogs };
