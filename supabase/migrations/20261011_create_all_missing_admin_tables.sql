-- ==============================================================================
-- EnjoyFreeDeals: Consolidated Migration for All 13 Needed Admin Panel Tables
-- File: supabase/migrations/20261011_create_all_missing_admin_tables.sql
-- Safe, additive & idempotent (run directly in Supabase SQL Editor)
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  external_product_id text not null unique,
  product_group_key text not null default '',
  title text not null,
  description text not null default '',
  image_url text not null default '',
  brand text,
  model text,
  category_slug text not null default 'general',
  category_name text not null default 'General',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_external_product_id on public.products(external_product_id);
create index if not exists idx_products_category_slug on public.products(category_slug);
alter table public.products enable row level security;
drop policy if exists "Allow public read products" on public.products;
create policy "Allow public read products" on public.products for select using (true);
drop policy if exists "Service role full access on products" on public.products;
create policy "Service role full access on products" on public.products for all using (true) with check (true);

-- 2. product_offers
create table if not exists public.product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_slug text not null,
  product_url text not null default '',
  affiliate_url text not null default '',
  image_url text not null default '',
  original_price numeric not null default 0,
  current_price numeric not null default 0,
  discount_percent integer not null default 0,
  coupon_code text,
  delivery_info text,
  availability text not null default 'in_stock',
  status text not null default 'active',
  rating numeric,
  rating_count integer not null default 0,
  review_count integer not null default 0,
  is_hot_deal boolean not null default false,
  expires_at timestamptz,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, store_slug)
);
create index if not exists idx_product_offers_product_id on public.product_offers(product_id);
create index if not exists idx_product_offers_store_slug on public.product_offers(store_slug);
alter table public.product_offers enable row level security;
drop policy if exists "Allow public read product_offers" on public.product_offers;
create policy "Allow public read product_offers" on public.product_offers for select using (true);
drop policy if exists "Service role full access on product_offers" on public.product_offers;
create policy "Service role full access on product_offers" on public.product_offers for all using (true) with check (true);

-- 3. fetch_runs
create table if not exists public.fetch_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  upserted_count integer not null default 0,
  error_count integer not null default 0,
  errors text[] not null default '{}'::text[]
);
alter table public.fetch_runs enable row level security;
drop policy if exists "Service role full access on fetch_runs" on public.fetch_runs;
create policy "Service role full access on fetch_runs" on public.fetch_runs for all using (true) with check (true);

-- 4. saved_deals
create table if not exists public.saved_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, deal_id)
);
create index if not exists idx_saved_deals_user_created on public.saved_deals (user_id, created_at desc);
create index if not exists idx_saved_deals_deal on public.saved_deals (deal_id);
alter table public.saved_deals enable row level security;
drop policy if exists "Users manage their own saved_deals" on public.saved_deals;
create policy "Users manage their own saved_deals" on public.saved_deals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Service role full access on saved_deals" on public.saved_deals;
create policy "Service role full access on saved_deals" on public.saved_deals for all using (true) with check (true);

-- 5. price_alerts
create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  target_price numeric not null,
  current_price numeric,
  is_active boolean not null default true,
  is_triggered boolean not null default false,
  triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, deal_id)
);
create index if not exists idx_price_alerts_user_active on public.price_alerts (user_id, is_active, updated_at desc);
create index if not exists idx_price_alerts_deal on public.price_alerts (deal_id);
alter table public.price_alerts enable row level security;
drop policy if exists "Users manage their own price_alerts" on public.price_alerts;
create policy "Users manage their own price_alerts" on public.price_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Service role full access on price_alerts" on public.price_alerts;
create policy "Service role full access on price_alerts" on public.price_alerts for all using (true) with check (true);

-- 6. recently_viewed_deals
create table if not exists public.recently_viewed_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (user_id, deal_id)
);
create index if not exists idx_recently_viewed_user_viewed on public.recently_viewed_deals (user_id, viewed_at desc);
create index if not exists idx_recently_viewed_deal on public.recently_viewed_deals (deal_id);
alter table public.recently_viewed_deals enable row level security;
drop policy if exists "Users manage their own recently_viewed_deals" on public.recently_viewed_deals;
create policy "Users manage their own recently_viewed_deals" on public.recently_viewed_deals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Service role full access on recently_viewed_deals" on public.recently_viewed_deals;
create policy "Service role full access on recently_viewed_deals" on public.recently_viewed_deals for all using (true) with check (true);

-- 7. telegram_channels
create table if not exists public.telegram_channels (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  title text,
  is_active boolean default true,
  last_fetched_message_id text,
  last_scrape_time timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
insert into public.telegram_channels (username, title, is_active)
values
  ('king_deal_1', 'King Deal', true),
  ('icoolzTricks', 'iCoolz Tricks', true)
on conflict (username) do update set is_active = excluded.is_active, updated_at = now();
alter table public.telegram_channels enable row level security;
drop policy if exists "Allow public read telegram_channels" on public.telegram_channels;
create policy "Allow public read telegram_channels" on public.telegram_channels for select using (true);
drop policy if exists "Service role full access on telegram_channels" on public.telegram_channels;
create policy "Service role full access on telegram_channels" on public.telegram_channels for all using (true) with check (true);

-- 8. scrape_logs
create table if not exists public.scrape_logs (
  id uuid primary key default gen_random_uuid(),
  source_type text default 'telegram',
  source_channel text,
  telegram_message_id text,
  scrape_status text not null default 'failed',
  error_message text,
  message_text text,
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_scrape_logs_source_channel on public.scrape_logs(source_channel);
create index if not exists idx_scrape_logs_created_at on public.scrape_logs(created_at desc);
alter table public.scrape_logs enable row level security;
drop policy if exists "Service role full access on scrape_logs" on public.scrape_logs;
create policy "Service role full access on scrape_logs" on public.scrape_logs for all using (true) with check (true);

-- 9. telegram_sources
create table if not exists public.telegram_sources (
  id uuid primary key default gen_random_uuid(),
  channel_username text not null unique,
  channel_title text,
  source_type text not null default 'telegram',
  is_active boolean not null default true,
  requires_approval boolean not null default false,
  default_category text not null default 'Other Deals',
  default_store text not null default 'Telegram',
  last_fetched_message_id bigint,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_telegram_sources_channel_username on public.telegram_sources(channel_username);
create index if not exists idx_telegram_sources_is_active on public.telegram_sources(is_active);
create index if not exists idx_telegram_sources_last_fetched_at on public.telegram_sources(last_fetched_at);
insert into public.telegram_sources (channel_username, channel_title, requires_approval)
values
  ('king_deal_1', 'King Deal', false),
  ('icoolzTricks', 'iCoolz Tricks', false)
on conflict (channel_username) do update set channel_title = excluded.channel_title, is_active = true, updated_at = now();
alter table public.telegram_sources enable row level security;
drop policy if exists "Allow public read telegram_sources" on public.telegram_sources;
create policy "Allow public read telegram_sources" on public.telegram_sources for select using (true);
drop policy if exists "Service role full access on telegram_sources" on public.telegram_sources;
create policy "Service role full access on telegram_sources" on public.telegram_sources for all using (true) with check (true);

-- 10. price_tracking_requests
create table if not exists public.price_tracking_requests (
  id uuid primary key default gen_random_uuid(),
  product_url text not null,
  normalized_url text,
  store_name text,
  platform_product_id text,
  user_id uuid null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_price_tracking_requests_normalized_user
  on public.price_tracking_requests(normalized_url, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where normalized_url is not null;
create index if not exists idx_price_tracking_requests_status on public.price_tracking_requests(status);
create index if not exists idx_price_tracking_requests_store_product on public.price_tracking_requests(store_name, platform_product_id);
alter table public.price_tracking_requests enable row level security;
drop policy if exists "Allow public insert price_tracking_requests" on public.price_tracking_requests;
create policy "Allow public insert price_tracking_requests" on public.price_tracking_requests for insert with check (true);
drop policy if exists "Allow public read price_tracking_requests" on public.price_tracking_requests;
create policy "Allow public read price_tracking_requests" on public.price_tracking_requests for select using (true);
drop policy if exists "Service role full access on price_tracking_requests" on public.price_tracking_requests;
create policy "Service role full access on price_tracking_requests" on public.price_tracking_requests for all using (true) with check (true);

-- 11. tracked_products
create table if not exists public.tracked_products (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid null references public.deals(id) on delete set null,
  title text,
  image_url text,
  product_url text,
  normalized_url text,
  store_name text,
  platform_product_id text,
  current_price numeric,
  lowest_price numeric,
  highest_price numeric,
  average_price numeric,
  currency text not null default 'INR',
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_tracked_products_normalized_url
  on public.tracked_products(normalized_url)
  where normalized_url is not null;
create index if not exists idx_tracked_products_store_product on public.tracked_products(store_name, platform_product_id);
create index if not exists idx_tracked_products_last_checked_at on public.tracked_products(last_checked_at);
alter table public.tracked_products enable row level security;
drop policy if exists "Allow public read tracked_products" on public.tracked_products;
create policy "Allow public read tracked_products" on public.tracked_products for select using (true);
drop policy if exists "Service role full access on tracked_products" on public.tracked_products;
create policy "Service role full access on tracked_products" on public.tracked_products for all using (true) with check (true);

-- 12. upvoted_deals
create table if not exists public.upvoted_deals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  deal_id uuid references public.deals(id) on delete cascade,
  product_title text,
  platform text,
  deal_price numeric,
  original_price numeric,
  discount_percent numeric,
  product_url text,
  image_url text,
  created_at timestamptz default now(),
  unique(user_id, deal_id)
);
create index if not exists idx_upvoted_deals_user_id on public.upvoted_deals(user_id);
create index if not exists idx_upvoted_deals_deal_id on public.upvoted_deals(deal_id);
create index if not exists idx_upvoted_deals_created_at on public.upvoted_deals(created_at);
alter table public.upvoted_deals enable row level security;
drop policy if exists "Allow read upvoted deals" on public.upvoted_deals;
create policy "Allow read upvoted deals" on public.upvoted_deals for select using (true);
drop policy if exists "Allow insert upvoted deals" on public.upvoted_deals;
create policy "Allow insert upvoted deals" on public.upvoted_deals for insert with check (true);
drop policy if exists "Allow delete upvoted deals" on public.upvoted_deals;
create policy "Allow delete upvoted deals" on public.upvoted_deals for delete using (true);
drop policy if exists "Service role full access on upvoted_deals" on public.upvoted_deals;
create policy "Service role full access on upvoted_deals" on public.upvoted_deals for all using (true) with check (true);

-- 13. deal_upvotes
create table if not exists public.deal_upvotes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid null,
  guest_id text null,
  ip_hash text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint deal_upvotes_identity_check check (
    user_id is not null or guest_id is not null or ip_hash is not null
  )
);
create index if not exists idx_deal_upvotes_deal_id on public.deal_upvotes(deal_id);
create index if not exists idx_deal_upvotes_user_id on public.deal_upvotes(user_id);
create index if not exists idx_deal_upvotes_guest_id on public.deal_upvotes(guest_id);
create index if not exists idx_deal_upvotes_ip_hash on public.deal_upvotes(ip_hash);
create unique index if not exists deal_upvotes_deal_user_unique on public.deal_upvotes(deal_id, user_id) where user_id is not null;
create unique index if not exists deal_upvotes_deal_guest_unique on public.deal_upvotes(deal_id, guest_id) where guest_id is not null;
create unique index if not exists deal_upvotes_deal_ip_hash_unique on public.deal_upvotes(deal_id, ip_hash) where ip_hash is not null;
alter table public.deal_upvotes enable row level security;
drop policy if exists "Allow read deal_upvotes" on public.deal_upvotes;
create policy "Allow read deal_upvotes" on public.deal_upvotes for select using (true);
drop policy if exists "Service role full access on deal_upvotes" on public.deal_upvotes;
create policy "Service role full access on deal_upvotes" on public.deal_upvotes for all using (true) with check (true);

-- Ensure deal helper column and reload PostgREST schema cache
alter table public.deals add column if not exists upvote_count integer default 0;
notify pgrst, 'reload schema';
