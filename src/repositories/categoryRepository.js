const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "categories";

async function listCategories() {
  const [{ data, error }, dealCounts] = await Promise.all([
    supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
      .order("name", { ascending: true }),
    activeDealCountsByCategory()
  ]);
  throwIfSupabaseError(error, TABLE);
  return (data || [])
    .map((row) => toApiCategory(row, dealCounts.get(row.id) || 0))
    .sort((a, b) => {
      if (a.dealCount !== b.dealCount) return b.dealCount - a.dealCount;
      return a.categoryName.localeCompare(b.categoryName);
    });
}

async function activeDealCountsByCategory() {
  const updatedCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("category_id")
    .eq("status", "active")
    .gte("discounted_price", 0)
    .gte("updated_at", updatedCutoff)
    .not("last_scraped_at", "is", null)
    .not("dedupe_key", "is", null)
    .neq("source_url", "")
    .in("raw_source_payload->>connectorMode", ["html-scrape", "telegram-bot", "telegram-page", "telegram-channel", "direct-platform-fetch"]);

  if (error) {
    console.warn("[categories] Deal counts unavailable:", error.message);
    return new Map();
  }

  const counts = new Map();
  (data || []).forEach((deal) => {
    if (!deal.category_id) return;
    counts.set(deal.category_id, (counts.get(deal.category_id) || 0) + 1);
  });
  return counts;
}

function toApiCategory(row, dealCount = 0) {
  return {
    categoryId: row.id,
    categoryName: row.name,
    categoryIcon: row.icon || row.slug || "",
    categoryImage: row.image_url || "",
    description: row.description || "",
    isActive: row.is_active !== false,
    dealCount,
    deal_count: dealCount,
    slug: row.slug || "",
    createdAt: row.created_at
  };
}

module.exports = { listCategories };
