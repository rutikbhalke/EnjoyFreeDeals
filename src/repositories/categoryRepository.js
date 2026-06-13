const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "categories";

async function listCategories() {
  const [{ data, error }, dealCounts, otherDealsCount] = await Promise.all([
    supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    activeDealCountsByCategory(),
    activeOtherDealCount()
  ]);
  throwIfSupabaseError(error, TABLE);
  const categories = (data || [])
    .map((row) => toApiCategory(row, dealCounts.get(row.id) || 0))
    .sort((a, b) => {
      if (a.dealCount !== b.dealCount) return b.dealCount - a.dealCount;
      return a.categoryName.localeCompare(b.categoryName);
    });

  if (otherDealsCount > 0) {
    const existingIndex = categories.findIndex((category) => category.slug === "other-deals" || category.categoryName === "Other Deals");
    const otherCategory = toApiCategory({
      id: "other-deals",
      name: "Other Deals",
      slug: "other-deals",
      icon: "other-deals",
      image_url: "",
      description: "",
      is_active: true,
      created_at: null
    }, otherDealsCount);

    if (existingIndex >= 0) {
      categories[existingIndex] = {
        ...categories[existingIndex],
        ...otherCategory,
      };
    } else {
      categories.push(otherCategory);
    }
  }

  return categories;
}

async function activeDealCountsByCategory() {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("category_id")
    .gte("discounted_price", 0)
    .or(`platform_expires_at.is.null,platform_expires_at.gt.${now}`)
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

async function activeOtherDealCount() {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id")
    .gte("discounted_price", 0)
    .or(`platform_expires_at.is.null,platform_expires_at.gt.${now}`)
    .is("category_id", null)
    .in("raw_source_payload->>connectorMode", ["html-scrape", "telegram-bot", "telegram-page", "telegram-channel", "direct-platform-fetch"]);

  if (error) {
    console.warn("[categories] Other deals count unavailable:", error.message);
    return 0;
  }
  return (data || []).length;
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
