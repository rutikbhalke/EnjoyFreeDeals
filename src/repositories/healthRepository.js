const { supabaseAdmin } = require("../config/supabaseClient");
const { supabaseProjectRef } = require("../middleware/envValidator");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

async function checkSupabase() {
  const startedAt = Date.now();
  const { error, count } = await supabaseAdmin
    .from("categories")
    .select("*", { count: "exact" })
    .limit(1);
  throwIfSupabaseError(error, "categories");

  return {
    status: "ok",
    projectId: process.env.SUPABASE_PROJECT_ID || supabaseProjectRef(process.env.SUPABASE_URL),
    latencyMs: Date.now() - startedAt,
    categoriesCount: count || 0
  };
}

module.exports = { checkSupabase };
