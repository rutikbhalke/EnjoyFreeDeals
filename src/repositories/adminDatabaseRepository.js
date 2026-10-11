const fs = require("fs");
const path = require("path");
const { supabaseAdmin } = require("../config/supabaseClient");
const { isMissingTableError } = require("../utils/supabaseErrors");

const CONSOLIDATED_MIGRATION = "supabase/migrations/20261011_create_all_missing_admin_tables.sql";

const ADMIN_TABLES = [
  { name: "profiles", group: "Users", migration: "supabase/schema.sql" },
  { name: "sample_whatsapp_otp_logins", group: "Users", migration: CONSOLIDATED_MIGRATION },
  { name: "otp_verifications", group: "Users", migration: CONSOLIDATED_MIGRATION },
  { name: "user_roles", group: "Users", migration: "supabase/schema.sql" },
  { name: "user_preferences", group: "Users", migration: "supabase/schema.sql" },
  { name: "user_activity", group: "Users", migration: "supabase/migrations/20260621_ensure_missing_admin_tables.sql" },
  { name: "categories", group: "Catalog", migration: "supabase/schema.sql" },
  { name: "stores", group: "Catalog", migration: "supabase/schema.sql" },
  { name: "deals", group: "Deals", migration: "supabase/schema.sql" },
  { name: "products", group: "Deals", migration: CONSOLIDATED_MIGRATION },
  { name: "product_offers", group: "Deals", migration: CONSOLIDATED_MIGRATION },
  { name: "fetch_runs", group: "Imports", migration: CONSOLIDATED_MIGRATION },
  { name: "blog_posts", group: "Content", migration: "supabase/schema.sql" },
  { name: "deal_watchlist", group: "Engagement", migration: "supabase/schema.sql" },
  { name: "saved_deals", group: "Engagement", migration: CONSOLIDATED_MIGRATION },
  { name: "shared_deals", group: "Engagement", migration: "supabase/schema.sql" },
  { name: "price_alerts", group: "Pricing", migration: CONSOLIDATED_MIGRATION },
  { name: "recently_viewed_deals", group: "Engagement", migration: CONSOLIDATED_MIGRATION },
  { name: "price_history", group: "Pricing", migration: "supabase/schema.sql" },
  { name: "notifications", group: "Notifications", migration: "supabase/schema.sql" },
  { name: "deal_clicks", group: "Analytics", migration: "supabase/schema.sql" },
  { name: "deal_votes", group: "Engagement", migration: "supabase/schema.sql" },
  { name: "deal_comments", group: "Engagement", migration: "supabase/schema.sql" },
  { name: "cashback_transactions", group: "Wallet", migration: "supabase/schema.sql" },
  { name: "wallets", group: "Wallet", migration: "supabase/schema.sql" },
  { name: "withdrawal_requests", group: "Wallet", migration: "supabase/schema.sql" },
  { name: "referrals", group: "Users", migration: "supabase/schema.sql" },
  { name: "price_comparisons", group: "Pricing", migration: "supabase/migrations/20260610_price_comparison_feature.sql" },
  { name: "price_comparison_platforms", group: "Pricing", migration: "supabase/migrations/20260610_price_comparison_feature.sql" },
  { name: "scraper_jobs", group: "Imports", migration: "supabase/schema.sql" },
  { name: "deal_sources", group: "Imports", migration: "supabase/schema.sql" },
  { name: "scraped_deal_items", group: "Imports", migration: "supabase/schema.sql" },
  { name: "telegram_channels", group: "Telegram", migration: CONSOLIDATED_MIGRATION },
  { name: "scrape_logs", group: "Telegram", migration: CONSOLIDATED_MIGRATION },
  { name: "telegram_sources", group: "Telegram", migration: CONSOLIDATED_MIGRATION },
  { name: "price_tracking_requests", group: "Pricing", migration: CONSOLIDATED_MIGRATION },
  { name: "tracked_products", group: "Pricing", migration: CONSOLIDATED_MIGRATION },
  { name: "upvoted_deals", group: "Engagement", migration: CONSOLIDATED_MIGRATION },
  { name: "deal_upvotes", group: "Engagement", migration: CONSOLIDATED_MIGRATION }
];

function getMissingTablesSql() {
  try {
    const migrationPath = path.resolve(__dirname, "../../", CONSOLIDATED_MIGRATION);
    return fs.readFileSync(migrationPath, "utf8");
  } catch (_err) {
    return "";
  }
}

async function listAdminTables() {
  const tables = await Promise.all(ADMIN_TABLES.map((table) => checkTable(table)));

  const summary = tables.reduce((acc, table) => {
    acc.total += 1;
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, { total: 0, ok: 0, missing: 0, error: 0 });

  const missingTablesSql = getMissingTablesSql();
  const projectId = process.env.SUPABASE_PROJECT_ID || "pzgyphnerjatlqlvvvsl";

  return {
    summary,
    tables,
    missingTablesSql,
    missingCount: summary.missing,
    supabaseSqlEditorUrl: `https://supabase.com/dashboard/project/${projectId}/sql/new`,
    checkedAt: new Date().toISOString()
  };
}

async function checkTable(table) {
  const startedAt = Date.now();
  // We use .limit(1) without head: true so PostgREST returns real row count for existing tables
  // and real schema cache error (PGRST205) for missing tables instead of HTTP 204.
  const { count, error } = await supabaseAdmin
    .from(table.name)
    .select("*", { count: "exact" })
    .limit(1);

  const latencyMs = Date.now() - startedAt;

  if (!error) {
    return {
      ...table,
      status: "ok",
      count: count ?? 0,
      latencyMs
    };
  }

  const isMissing = isMissingTableError(error);

  return {
    ...table,
    status: isMissing ? "missing" : "error",
    count: null,
    latencyMs,
    errorCode: error.code || "SUPABASE_ERROR",
    errorMessage: isMissing ? "Table missing in Supabase schema." : (error.message || "Supabase table check failed.")
  };
}

module.exports = {
  ADMIN_TABLES,
  CONSOLIDATED_MIGRATION,
  getMissingTablesSql,
  listAdminTables
};
