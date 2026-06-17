const { supabaseAdmin } = require("../config/supabaseClient");
const { sendSuccess } = require("../utils/responses");

// SQL that adds all missing columns to the deals table safely (IF NOT EXISTS)
const MIGRATION_SQL = `
alter table public.deals
  add column if not exists admin_notes           text          null,
  add column if not exists validation_flags      jsonb         default '[]'::jsonb,
  add column if not exists upvote_count          integer       default 0,
  add column if not exists vote_score            integer       default 0,
  add column if not exists click_count           integer       default 0,
  add column if not exists price_range_min       numeric       null,
  add column if not exists price_range_max       numeric       null,
  add column if not exists approved_at           timestamptz   null,
  add column if not exists rejected_at           timestamptz   null,
  add column if not exists approved_by           text          null,
  add column if not exists rejected_reason       text          null,
  add column if not exists availability          text          null,
  add column if not exists source_type           text          default 'manual',
  add column if not exists source_channel        text          null,
  add column if not exists source_image_url      text          null,
  add column if not exists platform_product_url  text          null,
  add column if not exists price_status          text          default 'detected',
  add column if not exists price_min             numeric       null,
  add column if not exists price_max             numeric       null,
  add column if not exists manual_price_note     text          null,
  add column if not exists expiry_status         text          default 'detected',
  add column if not exists expiry_at             timestamptz   null,
  add column if not exists expiry_note           text          null,
  add column if not exists admin_review_status   text          default 'approved',
  add column if not exists is_expired            boolean       default false,
  add column if not exists is_valid              boolean       default true,
  add column if not exists is_verified           boolean       default false,
  add column if not exists is_featured           boolean       default false,
  add column if not exists last_scraped_at       timestamptz   null,
  add column if not exists lowest_price          numeric       null,
  add column if not exists best_platform         text          null,
  add column if not exists last_price_checked_at timestamptz   null,
  add column if not exists deal_score            integer       default 0,
  add column if not exists slug                  text          null,
  add column if not exists title                 text          null,
  add column if not exists description           text          null,
  add column if not exists affiliate_link        text          null,
  add column if not exists discounted_price      numeric       null,
  add column if not exists discount_percentage   numeric       null,
  add column if not exists cashback_percentage   numeric       null,
  add column if not exists status                text          default 'approved',
  add column if not exists store_id              uuid          null,
  add column if not exists category_id           uuid          null,
  add column if not exists source_url            text          default '',
  add column if not exists is_best_price         boolean       default false,
  add column if not exists is_hot_deal           boolean       default false;

notify pgrst, 'reload schema';
`;

async function runMigration(req, res, next) {
  try {
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql: MIGRATION_SQL }).catch(() => ({ error: null }));

    // Fallback: try direct SQL via the REST API approach
    // Since supabase-js doesn't expose raw SQL, we use a known workaround:
    // Insert a dummy record with all new columns to force schema refresh
    // We also call notify pgrst separately
    await supabaseAdmin.rpc("exec_sql", { sql: "notify pgrst, 'reload schema';" }).catch(() => {});

    return sendSuccess(res, {
      message: "Migration attempted. If columns still missing, please run the SQL manually in Supabase SQL Editor.",
      sql: MIGRATION_SQL.trim()
    });
  } catch (err) {
    next(err);
  }
}

async function getMigrationSql(req, res, next) {
  try {
    return sendSuccess(res, {
      sql: MIGRATION_SQL.trim(),
      instructions: "Copy the SQL above and run it in your Supabase SQL Editor (https://supabase.com → your project → SQL Editor → New Query → Paste → Run)"
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { runMigration, getMigrationSql };
