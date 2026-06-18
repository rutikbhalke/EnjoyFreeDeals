-- ============================================================
-- Migration: Add admin_notes and all missing admin columns
-- Run this in your Supabase SQL Editor if you get the error:
--   "Could not find the 'admin_notes' column of 'deals'"
-- All statements use IF NOT EXISTS so they are safe to re-run.
-- ============================================================

alter table public.deals
  add column if not exists admin_notes         text          null,
  add column if not exists validation_flags    jsonb         default '[]'::jsonb,
  add column if not exists upvote_count        integer       default 0,
  add column if not exists price_range_min     numeric       null,
  add column if not exists price_range_max     numeric       null,
  add column if not exists approved_at         timestamptz   null,
  add column if not exists rejected_at         timestamptz   null,
  add column if not exists approved_by         text          null,
  add column if not exists rejected_reason     text          null,
  add column if not exists availability        text          null,
  add column if not exists source_type         text          default 'manual',
  add column if not exists source_channel      text          null,
  add column if not exists source_image_url    text          null,
  add column if not exists final_image_url     text          null,
  add column if not exists platform_product_url text         null,
  add column if not exists price_status        text          default 'detected',
  add column if not exists price_min           numeric       null,
  add column if not exists price_max           numeric       null,
  add column if not exists manual_price_note   text          null,
  add column if not exists expiry_status       text          default 'detected',
  add column if not exists expiry_at           timestamptz   null,
  add column if not exists expiry_note         text          null,
  add column if not exists admin_review_status text          default 'approved',
  add column if not exists is_expired          boolean       default false,
  add column if not exists is_valid            boolean       default true,
  add column if not exists is_verified         boolean       default false,
  add column if not exists is_featured         boolean       default false,
  add column if not exists fetched_at          timestamptz   null,
  add column if not exists source_updated_at   timestamptz   null,
  add column if not exists platform_expires_at timestamptz   null,
  add column if not exists telegram_channel    text          null,
  add column if not exists raw_source_payload  jsonb         default '{}'::jsonb,
  add column if not exists last_scraped_at     timestamptz   null,
  add column if not exists vote_score          integer       default 0,
  add column if not exists click_count         integer       default 0,
  add column if not exists deal_score          integer       default 0,
  add column if not exists lowest_price        numeric       null,
  add column if not exists best_platform       text          null,
  add column if not exists last_price_checked_at timestamptz null;

-- Ensure status column uses text type and has a default
alter table public.deals alter column status drop default;
alter table public.deals alter column status type text using status::text;
alter table public.deals alter column status set default 'approved';

create index if not exists idx_deals_admin_review_status
  on public.deals(admin_review_status);
create index if not exists idx_deals_platform_expires_at
  on public.deals(platform_expires_at);
create index if not exists idx_deals_telegram_channel
  on public.deals(telegram_channel);

-- Reload PostgREST schema cache so columns are immediately available
notify pgrst, 'reload schema';
