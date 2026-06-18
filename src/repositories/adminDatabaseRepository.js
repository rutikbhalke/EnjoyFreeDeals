const { supabaseAdmin } = require("../config/supabaseClient");
const { isMissingTableError } = require("../utils/supabaseErrors");

const ADMIN_TABLES = [
  { name: "profiles", group: "Users", migration: "supabase/schema.sql" },
  { name: "sample_whatsapp_otp_logins", group: "Users", migration: "supabase/schema.sql" },
  { name: "user_roles", group: "Users", migration: "supabase/schema.sql" },
  { name: "user_preferences", group: "Users", migration: "supabase/schema.sql" },
  { name: "categories", group: "Catalog", migration: "supabase/schema.sql" },
  { name: "stores", group: "Catalog", migration: "supabase/schema.sql" },
  { name: "deals", group: "Deals", migration: "supabase/schema.sql" },
  { name: "products", group: "Deals", migration: "supabase/schema.sql" },
  { name: "product_offers", group: "Deals", migration: "supabase/schema.sql" },
  { name: "fetch_runs", group: "Imports", migration: "supabase/schema.sql" },
  { name: "blog_posts", group: "Content", migration: "supabase/schema.sql" },
  { name: "deal_watchlist", group: "Engagement", migration: "supabase/schema.sql" },
  { name: "saved_deals", group: "Engagement", migration: "supabase/schema.sql" },
  { name: "shared_deals", group: "Engagement", migration: "supabase/schema.sql" },
  { name: "price_alerts", group: "Pricing", migration: "supabase/schema.sql" },
  { name: "recently_viewed_deals", group: "Engagement", migration: "supabase/schema.sql" },
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
  { name: "telegram_channels", group: "Telegram", migration: "supabase_telegram_manual_review.sql" },
  { name: "scrape_logs", group: "Telegram", migration: "supabase_telegram_manual_review.sql" },
  { name: "telegram_sources", group: "Telegram", migration: "supabase/migrations/20260612_live_telegram_sources.sql" },
  { name: "price_tracking_requests", group: "Pricing", migration: "supabase/migrations/20260613_web_price_tracking.sql" },
  { name: "tracked_products", group: "Pricing", migration: "supabase/migrations/20260613_web_price_tracking.sql" },
  { name: "upvoted_deals", group: "Engagement", migration: "supabase/migrations/20260611_web_upvoted_deals.sql" },
  { name: "deal_upvotes", group: "Engagement", migration: "supabase/migrations/20260615_ensure_deal_upvotes_table.sql" }
];

async function listAdminTables() {
  const tables = [];

  for (const table of ADMIN_TABLES) {
    tables.push(await checkTable(table));
  }

  const summary = tables.reduce((acc, table) => {
    acc.total += 1;
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, { total: 0, ok: 0, missing: 0, error: 0 });

  return {
    summary,
    tables,
    checkedAt: new Date().toISOString()
  };
}

async function checkTable(table) {
  const startedAt = Date.now();
  const { count, error } = await supabaseAdmin
    .from(table.name)
    .select("*", { count: "exact", head: true });

  const latencyMs = Date.now() - startedAt;

  if (!error) {
    return {
      ...table,
      status: "ok",
      count: count ?? null,
      latencyMs
    };
  }

  return {
    ...table,
    status: isMissingTableError(error) ? "missing" : "error",
    count: null,
    latencyMs,
    errorCode: error.code || "SUPABASE_ERROR",
    errorMessage: error.message || "Supabase table check failed."
  };
}

module.exports = {
  ADMIN_TABLES,
  listAdminTables
};
