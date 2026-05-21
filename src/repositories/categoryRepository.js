const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "categories";

async function listCategories() {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  throwIfSupabaseError(error, TABLE);
  return (data || []).map(toApiCategory);
}

function toApiCategory(row) {
  return {
    categoryId: row.id,
    categoryName: row.name,
    categoryIcon: row.icon || row.slug || "",
    categoryImage: row.image_url || "",
    description: row.description || "",
    isActive: row.is_active !== false,
    slug: row.slug || "",
    createdAt: row.created_at
  };
}

module.exports = { listCategories };
