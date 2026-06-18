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
  add column if not exists final_image_url       text          null,
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
  add column if not exists fetched_at            timestamptz   null,
  add column if not exists source_updated_at     timestamptz   null,
  add column if not exists platform_expires_at   timestamptz   null,
  add column if not exists telegram_channel      text          null,
  add column if not exists raw_source_payload    jsonb         default '{}'::jsonb,
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

alter table public.deals alter column status drop default;
alter table public.deals alter column status type text using status::text;
alter table public.deals alter column status set default 'approved';

create index if not exists idx_deals_admin_review_status
  on public.deals(admin_review_status);
create index if not exists idx_deals_platform_expires_at
  on public.deals(platform_expires_at);
create index if not exists idx_deals_telegram_channel
  on public.deals(telegram_channel);

notify pgrst, 'reload schema';
`;

async function runMigration(req, res, next) {
  try {
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql: MIGRATION_SQL });
    if (error) {
      const migrationError = new Error(`${error.message || "Unable to run migration automatically."} Copy the SQL from /api/admin/migrate/sql and run it in Supabase SQL Editor.`);
      migrationError.statusCode = 501;
      throw migrationError;
    }

    return sendSuccess(res, {
      message: "Migration applied. PostgREST schema cache reload requested.",
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
