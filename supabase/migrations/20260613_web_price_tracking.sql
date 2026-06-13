create extension if not exists pgcrypto;

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
create index if not exists idx_price_tracking_requests_status
  on public.price_tracking_requests(status);
create index if not exists idx_price_tracking_requests_store_product
  on public.price_tracking_requests(store_name, platform_product_id);

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
create index if not exists idx_tracked_products_store_product
  on public.tracked_products(store_name, platform_product_id);
create index if not exists idx_tracked_products_last_checked_at
  on public.tracked_products(last_checked_at);

alter table public.price_history add column if not exists product_url text;
alter table public.price_history add column if not exists store_name text;
alter table public.price_history add column if not exists platform_product_id text;
alter table public.price_history add column if not exists currency text not null default 'INR';
alter table public.price_history add column if not exists checked_at timestamptz default now();
alter table public.price_history add column if not exists source text not null default 'telegram/backend';

create index if not exists idx_price_history_product_url
  on public.price_history(product_url);
create index if not exists idx_price_history_store_product
  on public.price_history(store_name, platform_product_id);
create index if not exists idx_price_history_checked_at
  on public.price_history(checked_at);
