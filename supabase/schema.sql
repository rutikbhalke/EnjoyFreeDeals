-- EnjoyFreeDeals Supabase schema reference.
-- This matches the current live database names used by the backend:
-- profiles, categories, stores, deals, blog_posts, deal_watchlist, shared_deals,
-- price_history, notifications, user_preferences, deal activity/cashback tables,
-- and scraper automation tables.
--
-- Safe to hand to the Supabase owner. It is additive and does not drop data.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text not null default '',
  referral_code text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sample_whatsapp_otp_logins (
  mobile text primary key,
  otp_code text not null,
  display_name text not null default 'WhatsApp User',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text not null default '',
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text not null default '',
  website_url text not null default '',
  affiliate_base_url text not null default '',
  description text not null default '',
  cashback_percentage numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.stores add column if not exists last_synced_at timestamptz;

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  store_id uuid references public.stores(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  original_price numeric not null default 0,
  discounted_price numeric not null default 0,
  discount_percentage numeric not null default 0,
  coupon_code text not null default '',
  cashback_percentage numeric not null default 0,
  affiliate_link text not null default '',
  image_url text not null default '',
  expiry_date timestamptz,
  status text not null default 'active',
  is_featured boolean not null default false,
  is_verified boolean not null default false,
  click_count integer not null default 0,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'manual',
  vote_score integer not null default 0
);

alter table public.deals add column if not exists source_product_id text not null default '';
alter table public.deals add column if not exists source_url text not null default '';
alter table public.deals add column if not exists dedupe_key text;
alter table public.deals add column if not exists last_scraped_at timestamptz;
alter table public.deals add column if not exists raw_source_payload jsonb not null default '{}'::jsonb;

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

create table if not exists public.fetch_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  upserted_count integer not null default 0,
  error_count integer not null default 0,
  errors text[] not null default '{}'::text[]
);

create or replace function public.fallback_deal_image(
  title text,
  category_name text default '',
  store_name text default ''
)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(title, '') || ' ' || coalesce(category_name, '') || ' ' || coalesce(store_name, '')) ~ '(phone|mobile|smartphone)' then 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80'
    when lower(coalesce(title, '') || ' ' || coalesce(category_name, '') || ' ' || coalesce(store_name, '')) ~ '(shoe|sneaker|footwear)' then 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'
    when lower(coalesce(title, '') || ' ' || coalesce(category_name, '') || ' ' || coalesce(store_name, '')) ~ '(shirt|t-shirt|kurti|dress|fashion|jeans|saree)' then 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'
    when lower(coalesce(title, '') || ' ' || coalesce(category_name, '') || ' ' || coalesce(store_name, '')) ~ '(grocery|fruit|food|snack|tea|coffee)' then 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'
    when lower(coalesce(title, '') || ' ' || coalesce(category_name, '') || ' ' || coalesce(store_name, '')) ~ '(beauty|skin|makeup|cosmetic)' then 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80'
    when lower(coalesce(title, '') || ' ' || coalesce(category_name, '') || ' ' || coalesce(store_name, '')) ~ '(kitchen|home|storage|container)' then 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=900&q=80'
    when lower(coalesce(title, '') || ' ' || coalesce(category_name, '') || ' ' || coalesce(store_name, '')) ~ '(laptop|student|backpack|bag)' then 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'
    when lower(coalesce(title, '') || ' ' || coalesce(category_name, '') || ' ' || coalesce(store_name, '')) ~ '(earbud|speaker|watch|charger|camera|tablet|headphone)' then 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80'
    else 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80'
  end
$$;

create or replace view public.active_deals as
select
  d.id::text as offer_id,
  coalesce(nullif(d.source_product_id, ''), d.id::text) as product_id,
  d.title as product_name,
  ''::text as brand,
  ''::text as model,
  coalesce(c.name, 'General') as category_name,
  coalesce(c.slug, 'general') as category_slug,
  coalesce(s.name, 'Store') as store_name,
  coalesce(s.slug, 'store') as store_slug,
  coalesce(s.logo_url, '') as store_logo_url,
  coalesce(
    nullif(d.image_url, ''),
    nullif(d.raw_source_payload ->> 'imageUrl', ''),
    nullif(d.raw_source_payload ->> 'image_url', ''),
    nullif(d.raw_source_payload ->> 'productImage', ''),
    nullif(d.raw_source_payload ->> 'product_image', ''),
    nullif(d.raw_source_payload ->> 'photoUrl', ''),
    nullif(d.raw_source_payload ->> 'photo_url', ''),
    nullif(d.raw_source_payload ->> 'thumbnailUrl', ''),
    nullif(d.raw_source_payload ->> 'thumbnail_url', ''),
    nullif(d.raw_source_payload ->> 'thumbnail', ''),
    public.fallback_deal_image(d.title, c.name, s.name)
  ) as image_url,
  d.title,
  coalesce(nullif(d.source_url, ''), d.affiliate_link) as product_url,
  d.affiliate_link as affiliate_url,
  d.original_price,
  d.discounted_price as lowest_price,
  d.discount_percentage::integer as discount_percent,
  d.coupon_code,
  'See store'::text as delivery_info,
  4.3::numeric as rating,
  0::integer as rating_count,
  0::integer as review_count,
  (d.discount_percentage >= 50 or d.is_featured) as is_hot_deal,
  (d.discounted_price = 0) as is_free_deal,
  false as is_lowest_price,
  case when d.status = 'active' then 'in_stock' else d.status end as availability,
  d.updated_at as last_updated,
  d.expiry_date as expires_at
from public.deals d
left join public.stores s on s.id = d.store_id
left join public.categories c on c.id = d.category_id
where d.status = 'active'
union all
select
  po.id::text as offer_id,
  p.id::text as product_id,
  p.title as product_name,
  p.brand,
  p.model,
  coalesce(nullif(p.category_name, ''), 'General') as category_name,
  coalesce(nullif(p.category_slug, ''), 'general') as category_slug,
  coalesce(s.name, initcap(replace(po.store_slug, '-', ' ')), 'Store') as store_name,
  po.store_slug,
  coalesce(s.logo_url, '') as store_logo_url,
  coalesce(
    nullif(po.image_url, ''),
    nullif(p.image_url, ''),
    public.fallback_deal_image(p.title, p.category_name, coalesce(s.name, po.store_slug))
  ) as image_url,
  p.title,
  po.product_url,
  po.affiliate_url,
  po.original_price,
  po.current_price as lowest_price,
  po.discount_percent,
  po.coupon_code,
  coalesce(po.delivery_info, 'See store') as delivery_info,
  po.rating,
  po.rating_count,
  po.review_count,
  po.is_hot_deal,
  (po.current_price = 0) as is_free_deal,
  po.current_price <= min(po.current_price) over (partition by po.product_id) as is_lowest_price,
  po.availability,
  coalesce(po.last_checked_at, po.updated_at) as last_updated,
  po.expires_at
from public.product_offers po
join public.products p on p.id = po.product_id
left join public.stores s on s.slug = po.store_slug
where po.status = 'active'
  and (po.expires_at is null or po.expires_at > now())
  and not exists (
    select 1
    from public.deals mirrored
    where mirrored.status = 'active'
      and mirrored.source_product_id = p.external_product_id
      and mirrored.raw_source_payload ->> 'connectorMode' = 'direct-platform-fetch'
      and mirrored.raw_source_payload ->> 'provider' = po.store_slug
  );

create or replace function public.cleanup_expired_deals()
returns void
language sql
as $$
  update public.deals
  set status = 'expired', updated_at = now()
  where status = 'active'
    and expiry_date is not null
    and expiry_date <= now();

  update public.product_offers
  set status = 'expired', availability = 'out_of_stock', updated_at = now()
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
$$;

update public.deals d
set
  image_url = public.fallback_deal_image(
    d.title,
    (select c.name from public.categories c where c.id = d.category_id),
    (select s.name from public.stores s where s.id = d.store_id)
  ),
  updated_at = now()
where nullif(d.image_url, '') is null;

with source_categories as (
  select distinct
    coalesce(nullif(p.category_name, ''), 'General') as name,
    coalesce(nullif(p.category_slug, ''), 'general') as slug
  from public.products p
),
upsert_categories as (
  insert into public.categories (name, slug, is_active)
  select name, slug, true
  from source_categories
  on conflict (slug) do update set
    name = excluded.name,
    is_active = true
  returning id, slug
),
source_stores as (
  select distinct
    po.store_slug as slug,
    initcap(replace(po.store_slug, '-', ' ')) as name
  from public.product_offers po
  where po.store_slug <> ''
),
upsert_stores as (
  insert into public.stores (name, slug, is_active)
  select name, slug, true
  from source_stores
  on conflict (slug) do update set
    name = excluded.name,
    is_active = true
  returning id, slug
),
direct_platform_deals as (
  select
    p.title,
    trim(both '-' from lower(regexp_replace(po.store_slug || '-' || p.external_product_id, '[^a-zA-Z0-9]+', '-', 'g'))) as slug,
    p.description,
    us.id as store_id,
    uc.id as category_id,
    po.original_price,
    po.current_price as discounted_price,
    po.discount_percent as discount_percentage,
    coalesce(po.coupon_code, '') as coupon_code,
    po.affiliate_url,
    coalesce(
      nullif(po.image_url, ''),
      nullif(p.image_url, ''),
      public.fallback_deal_image(p.title, p.category_name, po.store_slug)
    ) as image_url,
    po.expires_at as expiry_date,
    po.status,
    po.is_hot_deal,
    p.external_product_id as source_product_id,
    po.product_url,
    po.store_slug,
    coalesce(nullif(p.category_name, ''), 'General') as category_name,
    coalesce(po.last_checked_at, po.updated_at, now()) as last_scraped_at
  from public.product_offers po
  join public.products p on p.id = po.product_id
  left join upsert_stores us on us.slug = po.store_slug
  left join upsert_categories uc on uc.slug = coalesce(nullif(p.category_slug, ''), 'general')
  where po.product_url <> ''
)
insert into public.deals (
  title,
  slug,
  description,
  store_id,
  category_id,
  original_price,
  discounted_price,
  discount_percentage,
  coupon_code,
  cashback_percentage,
  affiliate_link,
  image_url,
  expiry_date,
  status,
  is_featured,
  is_verified,
  source,
  source_product_id,
  source_url,
  dedupe_key,
  last_scraped_at,
  raw_source_payload
)
select
  title,
  slug,
  description,
  store_id,
  category_id,
  original_price,
  discounted_price,
  discount_percentage,
  coupon_code,
  0,
  affiliate_url,
  image_url,
  expiry_date,
  status,
  is_hot_deal,
  true,
  case when discounted_price = 0 then 'FREE_DEAL' when coupon_code <> '' then 'COUPON' else 'DISCOUNT' end,
  source_product_id,
  product_url,
  'direct-platform:' || store_slug || ':' || source_product_id,
  last_scraped_at,
  jsonb_build_object(
    'connectorMode', 'direct-platform-fetch',
    'provider', store_slug,
    'categoryName', category_name,
    'imageUrl', image_url,
    'productUrl', product_url,
    'normalizedAt', now()
  )
from direct_platform_deals
where slug <> ''
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  store_id = excluded.store_id,
  category_id = excluded.category_id,
  original_price = excluded.original_price,
  discounted_price = excluded.discounted_price,
  discount_percentage = excluded.discount_percentage,
  coupon_code = excluded.coupon_code,
  affiliate_link = excluded.affiliate_link,
  image_url = excluded.image_url,
  expiry_date = excluded.expiry_date,
  status = excluded.status,
  is_featured = excluded.is_featured,
  is_verified = excluded.is_verified,
  source = excluded.source,
  source_product_id = excluded.source_product_id,
  source_url = excluded.source_url,
  dedupe_key = excluded.dedupe_key,
  last_scraped_at = excluded.last_scraped_at,
  raw_source_payload = excluded.raw_source_payload,
  updated_at = now();

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  cover_image text not null default '',
  category text not null default '',
  tags text[] not null default '{}'::text[],
  author_name text not null default 'BizFlow Team',
  status text not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  meta_description text not null default ''
);

create table if not exists public.deal_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  target_price numeric,
  created_at timestamptz not null default now()
);

create unique index if not exists deal_watchlist_user_deal_unique_idx
  on public.deal_watchlist (user_id, deal_id);

create table if not exists public.shared_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  share_channel text not null default 'system',
  recipient text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  price numeric not null default 0,
  recorded_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'SYSTEM',
  title text not null,
  message text not null,
  deal_id uuid references public.deals(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  favorite_categories uuid[] not null default '{}'::uuid[],
  favorite_stores uuid[] not null default '{}'::uuid[],
  price_drop_alerts boolean not null default true,
  flash_sale_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.deal_clicks (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  clicked_at timestamptz not null default now(),
  ip_address text
);

create table if not exists public.deal_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  vote integer not null default 1,
  created_at timestamptz not null default now(),
  unique (user_id, deal_id)
);

create table if not exists public.deal_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  content text not null,
  is_confirmation boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cashback_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_click_id uuid references public.deal_clicks(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  amount numeric not null default 0,
  status text not null default 'pending',
  admin_note text,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  balance numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  status text not null default 'pending',
  payment_method text not null default '',
  payment_details jsonb not null default '{}'::jsonb,
  processed_by uuid references auth.users(id) on delete set null,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid not null references auth.users(id) on delete cascade,
  signup_bonus numeric not null default 0,
  transaction_bonus numeric not null default 0,
  is_transaction_bonus_paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'user',
  unique (user_id, role)
);

create table if not exists public.price_comparisons (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  product_name text not null default '',
  image_url text not null default '',
  category text not null default '',
  original_price numeric not null default 0,
  lowest_price numeric not null default 0,
  discount_percentage numeric not null default 0,
  product_url text not null default '',
  store_name text not null default '',
  coupon_code text not null default '',
  rating numeric not null default 0,
  is_hot_deal boolean not null default false,
  is_free_deal boolean not null default false,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.price_comparison_platforms (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.price_comparisons(id) on delete cascade,
  platform text not null,
  price numeric not null default 0,
  product_url text not null default '',
  affiliate_url text not null default '',
  available boolean not null default true,
  delivery_info text not null default 'Free delivery',
  rating numeric not null default 4.2,
  coupon_code text not null default '',
  last_updated timestamptz not null default now()
);

create table if not exists public.scraper_jobs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null default 'api',
  status text not null default 'pending',
  imported_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_message text not null default '',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_name text not null,
  source_type text not null default 'api',
  base_url text not null default '',
  secret_name text not null default '',
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  trust_level integer not null default 1,
  run_interval_minutes integer not null default 60,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deal_sources add column if not exists config jsonb not null default '{}'::jsonb;

create table if not exists public.scraped_deal_items (
  id uuid primary key default gen_random_uuid(),
  scraper_job_id uuid references public.scraper_jobs(id) on delete set null,
  deal_source_id uuid references public.deal_sources(id) on delete set null,
  source_key text not null default '',
  source_product_id text not null default '',
  source_url text not null default '',
  title text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null default '',
  status text not null default 'pending',
  error_message text not null default '',
  matched_deal_id uuid references public.deals(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists deals_dedupe_key_unique_idx on public.deals (dedupe_key) where dedupe_key is not null;
create unique index if not exists profiles_user_id_unique_idx on public.profiles (user_id);
create index if not exists categories_active_name_idx on public.categories (is_active, name);
create index if not exists stores_active_name_idx on public.stores (is_active, name);
create index if not exists deals_status_created_idx on public.deals (status, created_at desc);
create index if not exists deals_category_status_idx on public.deals (category_id, status);
create index if not exists deals_store_status_idx on public.deals (store_id, status);
create index if not exists products_category_updated_idx on public.products (category_slug, updated_at desc);
create index if not exists product_offers_status_updated_idx on public.product_offers (status, updated_at desc);
create index if not exists product_offers_product_price_idx on public.product_offers (product_id, status, current_price);
create index if not exists blog_posts_status_published_idx on public.blog_posts (status, published_at desc);
create index if not exists deal_watchlist_user_created_idx on public.deal_watchlist (user_id, created_at desc);
create index if not exists shared_deals_user_created_idx on public.shared_deals (user_id, created_at desc);
create index if not exists shared_deals_deal_created_idx on public.shared_deals (deal_id, created_at desc);
create index if not exists price_history_deal_recorded_idx on public.price_history (deal_id, recorded_at desc);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists cashback_transactions_user_status_idx on public.cashback_transactions (user_id, status);
create index if not exists scraper_jobs_source_status_idx on public.scraper_jobs (source_name, status, created_at desc);
create index if not exists deal_sources_enabled_idx on public.deal_sources (enabled, source_key);
create index if not exists scraped_deal_items_status_idx on public.scraped_deal_items (status, created_at desc);
create unique index if not exists price_comparisons_deal_unique_idx on public.price_comparisons (deal_id);
create unique index if not exists price_comparison_platform_unique_idx on public.price_comparison_platforms (comparison_id, lower(platform));
create index if not exists price_comparison_platform_available_price_idx on public.price_comparison_platforms (comparison_id, available, price);

alter table public.profiles enable row level security;
alter table public.sample_whatsapp_otp_logins enable row level security;
alter table public.categories enable row level security;
alter table public.stores enable row level security;
alter table public.deals enable row level security;
alter table public.products enable row level security;
alter table public.product_offers enable row level security;
alter table public.fetch_runs enable row level security;
alter table public.blog_posts enable row level security;
alter table public.deal_watchlist enable row level security;
alter table public.shared_deals enable row level security;
alter table public.price_history enable row level security;
alter table public.notifications enable row level security;
alter table public.user_preferences enable row level security;
alter table public.deal_clicks enable row level security;
alter table public.deal_votes enable row level security;
alter table public.deal_comments enable row level security;
alter table public.cashback_transactions enable row level security;
alter table public.wallets enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.referrals enable row level security;
alter table public.user_roles enable row level security;
alter table public.price_comparisons enable row level security;
alter table public.price_comparison_platforms enable row level security;
alter table public.scraper_jobs enable row level security;
alter table public.deal_sources enable row level security;
alter table public.scraped_deal_items enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories" on public.categories
  for select to anon, authenticated using (is_active = true);

drop policy if exists "Public can read active stores" on public.stores;
create policy "Public can read active stores" on public.stores
  for select to anon, authenticated using (is_active = true);

drop policy if exists "Public can read active deals" on public.deals;
create policy "Public can read active deals" on public.deals
  for select to anon, authenticated using (status = 'active');

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products
  for select to anon, authenticated using (true);

drop policy if exists "Public can read active product offers" on public.product_offers;
create policy "Public can read active product offers" on public.product_offers
  for select to anon, authenticated using (status = 'active');

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts" on public.blog_posts
  for select to anon, authenticated using (status = 'published');

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own watchlist" on public.deal_watchlist;
create policy "Users manage own watchlist" on public.deal_watchlist
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own shared deals" on public.shared_deals;
create policy "Users manage own shared deals" on public.shared_deals
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own preferences" on public.user_preferences;
create policy "Users manage own preferences" on public.user_preferences
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Backend service_role bypasses RLS for admin/scraper writes.
-- Do not add anon/authenticated write policies to scraper_jobs, deal_sources, or scraped_deal_items.

create or replace function public.handle_new_auth_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, '')
  )
  on conflict do nothing;

  insert into public.wallets (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_profile();

insert into public.deal_sources (source_key, source_name, source_type, base_url, secret_name, config, enabled, trust_level, run_interval_minutes)
values
  ('amazon', 'Amazon', 'scrape', 'https://www.amazon.in', '', '{}'::jsonb, true, 4, 60),
  ('flipkart', 'Flipkart', 'scrape', 'https://www.flipkart.com', '', '{}'::jsonb, true, 4, 60),
  ('myntra', 'Myntra', 'scrape', 'https://www.myntra.com', '', '{}'::jsonb, true, 4, 60),
  ('ajio', 'Ajio', 'scrape', 'https://www.ajio.com', '', '{}'::jsonb, true, 4, 60),
  ('croma', 'Croma', 'scrape', 'https://www.croma.com', '', '{}'::jsonb, true, 4, 60),
  ('tatacliq', 'TataCliq', 'scrape', 'https://www.tatacliq.com', '', '{}'::jsonb, true, 4, 60)
on conflict (source_key) do update set
  source_name = excluded.source_name,
  source_type = excluded.source_type,
  base_url = excluded.base_url,
  secret_name = excluded.secret_name,
  config = public.deal_sources.config || excluded.config,
  enabled = excluded.enabled,
  trust_level = greatest(public.deal_sources.trust_level, excluded.trust_level),
  run_interval_minutes = excluded.run_interval_minutes,
  updated_at = now();
