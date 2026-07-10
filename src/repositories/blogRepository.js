const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "blog_posts";
const EXPORTFLOW_BLOG_DEAL = {
  blogId: "exportflow-15-day-free-demo",
  id: "exportflow-15-day-free-demo",
  title: "ExportFlow Export Management Software Deal: 15-Day Free Demo",
  slug: "exportflow-15-day-free-demo",
  image: "https://storage.googleapis.com/gpt-engineer-file-uploads/6PFzlUjLQ0ZD0L2f3zOhWk0VaY42/social-images/social-1759382293023-export.JPG",
  shortDescription: "Try ExportFlow for export invoices, shipment tracking, payments and reports with a free 15-day demo. Contact BizFlow India at 8888567870.",
  fullContent: [
    "Try ExportFlow for export invoices, shipment tracking, payments and reports with a free 15-day demo. Contact BizFlow India at 8888567870.",
    "ExportFlow is an export management software deal for exporters who want GST invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations, and compliance reports in one workflow.",
    "Deal highlight: get a free 15-day demo before choosing a plan. Use the demo to test invoice creation, shipment tracking, payment follow-up, and export reports with your real workflow.",
    "Product link: https://exportflow.mywebz.in/",
    "Contact/demo: https://bizflowindia.cloud/",
    "Mobile: 8888567870",
    "This is listed as a software demo deal so buyers can evaluate the workflow before paying, not as a regular advertisement."
  ].join("\n\n"),
  author: "BizFlow Team",
  category: "Platform Guide",
  tags: ["exportflow", "export-management", "software-deal", "free-demo"],
  isPublished: true,
  metaDescription: "ExportFlow export management software deal with a free 15-day demo. Manage invoices, shipments, payments and export reports. Contact 8888567870.",
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
