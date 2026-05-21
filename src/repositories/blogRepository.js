const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "blog_posts";

async function listPublishedBlogs() {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  throwIfSupabaseError(error, TABLE);
  return (data || []).map(toApiBlog);
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
