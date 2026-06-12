create extension if not exists pgcrypto;

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

create index if not exists idx_telegram_sources_channel_username
  on public.telegram_sources(channel_username);
create index if not exists idx_telegram_sources_is_active
  on public.telegram_sources(is_active);
create index if not exists idx_telegram_sources_last_fetched_at
  on public.telegram_sources(last_fetched_at);

insert into public.telegram_sources (channel_username, channel_title, requires_approval)
values
  ('king_deal_1', 'King Deal', false),
  ('icoolzTricks', 'iCoolz Tricks', false)
on conflict (channel_username) do update set
  channel_title = excluded.channel_title,
  is_active = true,
  updated_at = now();

alter table public.deals add column if not exists fallback_image_url text;
alter table public.deals add column if not exists final_image_url text;
alter table public.deals add column if not exists source_image_url text;
alter table public.deals add column if not exists platform_product_url text;
alter table public.deals add column if not exists fetched_at timestamptz;
alter table public.deals add column if not exists source_updated_at timestamptz;
alter table public.deals add column if not exists platform_expires_at timestamptz;
alter table public.deals add column if not exists deal_score integer not null default 0;
alter table public.deals add column if not exists is_hot_deal boolean not null default false;
alter table public.deals add column if not exists is_super_hot_deal boolean not null default false;
alter table public.deals add column if not exists is_best_price boolean not null default false;
alter table public.deals add column if not exists is_coupon_deal boolean not null default false;
alter table public.deals add column if not exists is_free_deal boolean not null default false;
alter table public.deals add column if not exists telegram_channel text;
alter table public.deals add column if not exists telegram_message_id text;
alter table public.deals add column if not exists message_text text;

create index if not exists idx_deals_platform_expires_at
  on public.deals(platform_expires_at);
create index if not exists idx_deals_source_updated_at
  on public.deals(source_updated_at);
create index if not exists idx_deals_telegram_channel_message
  on public.deals(telegram_channel, telegram_message_id);
create index if not exists idx_deals_final_image_url
  on public.deals(final_image_url);
create index if not exists idx_deals_deal_score
  on public.deals(deal_score);
