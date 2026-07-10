const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "blog_posts";
const EXPORTFLOW_BLOG_DEAL = {
  blogId: "exportflow-15-day-free-demo",
  id: "exportflow-15-day-free-demo",
  title: "ExportFlow Software Offer: Free 15-Day Demo",
  slug: "exportflow-15-day-free-demo",
  image: "https://freedeals1.vercel.app/exportflow-document-hub.png",
  shortDescription: "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
  fullContent: [
    "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
    "Deal type: Free 15-day demo offer.",
    "Use the demo to try GST export invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations, and reports with your real workflow.",
    "ExportFlow: https://exportflow.mywebz.in/",
    "Book demo: https://bizflowindia.cloud/",
    "Mobile: 8888567870"
  ].join("\n\n"),
  author: "BizFlow Team",
  category: "Software Deals",
  tags: ["exportflow", "export-management", "software-offer", "free-demo"],
  isPublished: true,
  metaDescription: "ExportFlow software offer with a free 15-day demo. Manage export invoices, shipments, payments and reports. Demo booking: 8888567870.",
  publishedAt: "2026-07-10T00:00:00.000Z",
  createdAt: "2026-07-10T00:00:00.000Z",
  updatedAt: "2026-07-10T00:00:00.000Z"
};
const EDUFLOW_BLOG_DEAL = {
  blogId: "eduflow-education-management-software-offer",
  id: "eduflow-education-management-software-offer",
  title: "EduFlow Education Management Software Offer: Free Trial",
  slug: "eduflow-education-management-software-offer",
  image: "https://storage.googleapis.com/gpt-engineer-file-uploads/lAaVSYx4RVVmxIS64ld97TLZWug1/social-images/social-1760781174571-clg%20crm.JPG",
  shortDescription: "Try EduFlow for students, faculty, fees, attendance, hostel, library, transport, exams and placements. Free trial available.",
  fullContent: [
    "Try EduFlow for students, faculty, fees, attendance, hostel, library, transport, exams and placements. Free trial available.",
    "Deal type: Free trial education ERP offer.",
    "EduFlow is an education management platform for schools, colleges, universities and institutes that need student records, faculty workflows, fee collection, attendance tracking, hostel, library, transport, exams, placements and reports in one system.",
    "Use the trial to check admissions, student dashboards, attendance, fee receipts, exam/result workflows and institute reports with your real education management process.",
    "EduFlow: https://eduflow.mywebz.in/"
  ].join("\n\n"),
  author: "BizFlow Team",
  category: "Software Deals",
  tags: ["eduflow", "education-management", "school-erp", "college-erp", "software-offer", "free-trial"],
  isPublished: true,
  metaDescription: "EduFlow education management software offer with a free trial. Manage students, faculty, fees, attendance, exams, hostel, library, transport and placements.",
  publishedAt: "2026-07-10T00:00:00.000Z",
  createdAt: "2026-07-10T00:00:00.000Z",
  updatedAt: "2026-07-10T00:00:00.000Z"
};
const STATIC_BLOG_DEALS = [EDUFLOW_BLOG_DEAL, EXPORTFLOW_BLOG_DEAL];

async function listPublishedBlogs() {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  throwIfSupabaseError(error, TABLE);
  const blogs = (data || []).map(toApiBlog);
  const withoutDuplicate = blogs.filter((blog) => !STATIC_BLOG_DEALS.some((deal) => deal.slug === blog.slug));
  return [...STATIC_BLOG_DEALS, ...withoutDuplicate];
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
