create extension if not exists pgcrypto;

alter table if exists public.deals
  add column if not exists source_type text default 'manual',
  add column if not exists source_channel text,
  add column if not exists telegram_post_url text,
  add column if not exists price_status text default 'detected',
  add column if not exists price_min numeric,
  add column if not exists price_max numeric,
  add column if not exists manual_price_note text,
  add column if not exists expiry_status text default 'detected',
  add column if not exists expiry_at timestamptz,
  add column if not exists expiry_note text,
  add column if not exists admin_review_status text default 'approved',
  add column if not exists scrape_status text default 'success',
  add column if not exists is_expired boolean default false,
  add column if not exists last_scraped_at timestamptz;

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
on conflict (username) do update
set is_active = excluded.is_active,
    updated_at = now();

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

create index if not exists idx_deals_source_type on public.deals(source_type);
create index if not exists idx_deals_source_channel on public.deals(source_channel);
create index if not exists idx_deals_telegram_review on public.deals(source_channel, telegram_message_id);
create index if not exists idx_deals_price_status on public.deals(price_status);
create index if not exists idx_deals_expiry_status on public.deals(expiry_status);
create index if not exists idx_deals_admin_review_status on public.deals(admin_review_status);
create index if not exists idx_deals_is_expired on public.deals(is_expired);
create index if not exists idx_deals_expiry_at on public.deals(expiry_at);
create index if not exists idx_scrape_logs_channel on public.scrape_logs(source_channel);
create index if not exists idx_scrape_logs_status on public.scrape_logs(scrape_status);
create index if not exists idx_scrape_logs_created_at on public.scrape_logs(created_at);

create unique index if not exists idx_deals_unique_telegram_channel_message
on public.deals(source_channel, telegram_message_id)
where source_channel is not null and telegram_message_id is not null;

alter table public.telegram_channels enable row level security;
alter table public.scrape_logs enable row level security;

drop policy if exists "Service role can manage telegram channels" on public.telegram_channels;
create policy "Service role can manage telegram channels"
on public.telegram_channels for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage scrape logs" on public.scrape_logs;
create policy "Service role can manage scrape logs"
on public.scrape_logs for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
