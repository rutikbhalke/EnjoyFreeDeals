-- Price comparison support for EnjoyFreeDeals.
-- Keeps the existing two-table comparison model and adds compatibility columns
-- required by the backend, Android app, and web app.

create extension if not exists "pgcrypto";

create table if not exists public.price_comparisons (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  product_name text,
  image_url text,
  category text,
  original_price numeric,
  lowest_price numeric,
  discount_percentage numeric,
  product_url text,
  store_name text,
  coupon_code text,
  rating numeric,
  is_hot_deal boolean default false,
  is_free_deal boolean default false,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.price_comparison_platforms (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid references public.price_comparisons(id) on delete cascade,
  platform text not null,
  price numeric not null,
  product_url text not null,
  affiliate_url text,
  available boolean default true,
  delivery_info text,
  rating numeric,
  coupon_code text,
  last_updated timestamptz default now()
);

alter table if exists public.deals
  add column if not exists lowest_price numeric,
  add column if not exists best_platform text,
  add column if not exists comparison_count integer default 0,
  add column if not exists last_price_checked_at timestamptz;

alter table if exists public.price_comparison_platforms
  add column if not exists platform_logo_url text,
  add column if not exists original_price numeric,
  add column if not exists discount_percent numeric,
  add column if not exists delivery_charge numeric,
  add column if not exists review_count integer,
  add column if not exists is_lowest_price boolean default false,
  add column if not exists is_available boolean default true,
  add column if not exists last_checked_at timestamptz default now();

-- Compatibility columns for deployments that prefer a flat
-- price_comparisons row per platform. The current backend still uses
-- price_comparison_platforms for normalized platform rows.
alter table if exists public.price_comparisons
  add column if not exists product_id uuid references public.deals(id) on delete cascade,
  add column if not exists platform text,
  add column if not exists platform_logo_url text,
  add column if not exists price numeric,
  add column if not exists discount_percent numeric,
  add column if not exists delivery_charge numeric,
  add column if not exists review_count integer,
  add column if not exists is_lowest_price boolean default false,
  add column if not exists is_available boolean default true,
  add column if not exists last_checked_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists price_comparisons_deal_unique_idx
  on public.price_comparisons(deal_id)
  where deal_id is not null;

create index if not exists price_comparisons_deal_id_idx on public.price_comparisons(deal_id);
create index if not exists price_comparisons_product_id_idx on public.price_comparisons(product_id);
create index if not exists price_comparisons_platform_idx on public.price_comparisons(platform);
create index if not exists price_comparisons_price_idx on public.price_comparisons(price);
create index if not exists price_comparisons_lowest_idx on public.price_comparisons(is_lowest_price);
create index if not exists price_comparisons_available_idx on public.price_comparisons(is_available);
create index if not exists price_comparison_platforms_platform_idx on public.price_comparison_platforms(platform);
create index if not exists price_comparison_platforms_price_idx on public.price_comparison_platforms(price);
create index if not exists price_comparison_platforms_lowest_idx on public.price_comparison_platforms(is_lowest_price);
create index if not exists price_comparison_platforms_available_idx on public.price_comparison_platforms(is_available);
create index if not exists deals_lowest_price_idx on public.deals(lowest_price);
create index if not exists deals_best_platform_idx on public.deals(best_platform);
