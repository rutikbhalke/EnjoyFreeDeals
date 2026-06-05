-- Deal category, real platform expiry, image, and price integrity hardening.
-- This migration does not create fake 24-hour expiry values.

insert into public.categories (name, slug, icon, description, is_active)
values
  ('Electronics', 'electronics', 'electronics', 'Electronics deals.', true),
  ('Fashion', 'fashion', 'fashion', 'Fashion deals.', true),
  ('Mobile', 'mobile', 'mobile', 'Mobile and smartphone deals.', true),
  ('Laptop', 'laptop', 'laptop', 'Laptop deals.', true),
  ('Home & Kitchen', 'home-and-kitchen', 'home', 'Home and kitchen deals.', true),
  ('Grocery', 'grocery', 'grocery', 'Grocery deals.', true),
  ('Beauty', 'beauty', 'beauty', 'Beauty deals.', true),
  ('Appliances', 'appliances', 'appliances', 'Appliance deals.', true),
  ('Amazon Deals', 'amazon-deals', 'amazon', 'Amazon deals.', true),
  ('Flipkart Deals', 'flipkart-deals', 'flipkart', 'Flipkart deals.', true),
  ('Other Deals', 'other-deals', 'other-deals', 'Deals without a known category.', true)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  is_active = true;

alter table public.deals add column if not exists source_product_id text not null default '';
alter table public.deals add column if not exists source_url text not null default '';
alter table public.deals add column if not exists dedupe_key text;
alter table public.deals add column if not exists last_scraped_at timestamptz;
alter table public.deals add column if not exists fetched_at timestamptz default now();
alter table public.deals add column if not exists source_updated_at timestamptz;
alter table public.deals add column if not exists platform_expires_at timestamptz;
alter table public.deals add column if not exists source_image_url text;
alter table public.deals add column if not exists platform_product_url text;
alter table public.deals add column if not exists is_valid boolean not null default true;
alter table public.deals add column if not exists is_expired boolean not null default false;
alter table public.deals add column if not exists currency text not null default 'INR';
alter table public.deals add column if not exists raw_source_payload jsonb not null default '{}'::jsonb;

update public.deals d
set category_id = c.id,
    updated_at = now()
from public.categories c
where c.slug = 'other-deals'
  and d.category_id is null;

update public.deals
set is_valid = false,
    status = case when status = 'active' then 'invalid' else status end,
    updated_at = now()
where discounted_price < 0
   or original_price < 0
   or (original_price > 0 and discounted_price > original_price);

update public.deals
set is_expired = true,
    status = case when status = 'active' then 'expired' else status end,
    updated_at = now()
where platform_expires_at is not null
  and platform_expires_at <= now();

create unique index if not exists deals_dedupe_key_unique_idx
  on public.deals (dedupe_key)
  where dedupe_key is not null and dedupe_key <> '';

create unique index if not exists deals_store_source_product_unique_idx
  on public.deals (store_id, source_product_id)
  where source_product_id is not null and source_product_id <> '';

create unique index if not exists deals_store_source_url_unique_idx
  on public.deals (store_id, source_url)
  where (source_product_id is null or source_product_id = '')
    and source_url is not null
    and source_url <> '';

create index if not exists categories_name_idx on public.categories (name);
create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists stores_name_idx on public.stores (name);
create index if not exists deals_category_status_idx on public.deals (category_id, status);
create index if not exists deals_store_status_idx on public.deals (store_id, status);
create index if not exists deals_valid_expired_idx on public.deals (is_valid, is_expired);
create index if not exists deals_platform_expires_idx on public.deals (platform_expires_at);
create index if not exists deals_last_scraped_idx on public.deals (last_scraped_at desc);
create index if not exists deals_fetched_at_idx on public.deals (fetched_at desc);
create index if not exists deals_updated_at_idx on public.deals (updated_at desc);

create or replace function public.cleanup_expired_deals()
returns void
language sql
as $$
  update public.deals
  set is_expired = true,
      status = 'expired',
      updated_at = now()
  where status = 'active'
    and platform_expires_at is not null
    and platform_expires_at <= now();

  update public.product_offers
  set status = 'expired', availability = 'out_of_stock', updated_at = now()
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
$$;

create or replace view public.active_deals as
select
  d.id::text as offer_id,
  coalesce(nullif(d.source_product_id, ''), d.id::text) as product_id,
  d.title as product_name,
  ''::text as brand,
  ''::text as model,
  coalesce(c.name, 'Other Deals') as category_name,
  coalesce(c.slug, 'other-deals') as category_slug,
  coalesce(s.name, 'Store') as store_name,
  coalesce(s.slug, 'store') as store_slug,
  coalesce(s.logo_url, '') as store_logo_url,
  coalesce(
    nullif(d.image_url, ''),
    nullif(d.source_image_url, ''),
    nullif(d.raw_source_payload ->> 'imageUrl', ''),
    nullif(d.raw_source_payload ->> 'image_url', ''),
    nullif(d.raw_source_payload ->> 'productImage', ''),
    nullif(d.raw_source_payload ->> 'product_image', ''),
    nullif(d.raw_source_payload ->> 'photoUrl', ''),
    nullif(d.raw_source_payload ->> 'photo_url', ''),
    nullif(d.raw_source_payload ->> 'thumbnailUrl', ''),
    nullif(d.raw_source_payload ->> 'thumbnail_url', ''),
    nullif(d.raw_source_payload ->> 'thumbnail', '')
  ) as image_url,
  coalesce(nullif(d.source_image_url, ''), nullif(d.image_url, '')) as source_image_url,
  d.title,
  coalesce(nullif(d.source_url, ''), d.affiliate_link) as product_url,
  coalesce(nullif(d.platform_product_url, ''), nullif(d.source_url, ''), d.affiliate_link) as platform_product_url,
  d.affiliate_link as affiliate_url,
  d.original_price,
  d.discounted_price as lowest_price,
  d.currency,
  d.discount_percentage::integer as discount_percent,
  d.coupon_code,
  'See store'::text as delivery_info,
  4.3::numeric as rating,
  0::integer as rating_count,
  0::integer as review_count,
  (d.discount_percentage >= 50 or d.is_featured) as is_hot_deal,
  (d.discounted_price = 0) as is_free_deal,
  false as is_lowest_price,
  'in_stock'::text as availability,
  coalesce(d.source_updated_at, d.fetched_at, d.last_scraped_at, d.updated_at) as last_updated,
  d.platform_expires_at as expires_at
from public.deals d
left join public.stores s on s.id = d.store_id
left join public.categories c on c.id = d.category_id
where d.status = 'active'
  and d.is_valid = true
  and d.is_expired = false
  and d.discounted_price >= 0
  and (d.original_price <= 0 or d.discounted_price <= d.original_price)
  and (d.platform_expires_at is null or d.platform_expires_at > now())
  and coalesce(d.source_updated_at, d.fetched_at, d.last_scraped_at, d.updated_at, d.created_at) >= now() - interval '24 hours'
union all
select
  po.id::text as offer_id,
  p.id::text as product_id,
  p.title as product_name,
  p.brand,
  p.model,
  coalesce(nullif(p.category_name, ''), 'Other Deals') as category_name,
  coalesce(nullif(p.category_slug, ''), 'other-deals') as category_slug,
  coalesce(s.name, initcap(replace(po.store_slug, '-', ' ')), 'Store') as store_name,
  po.store_slug,
  coalesce(s.logo_url, '') as store_logo_url,
  coalesce(
    nullif(po.image_url, ''),
    nullif(p.image_url, '')
  ) as image_url,
  coalesce(nullif(po.image_url, ''), nullif(p.image_url, '')) as source_image_url,
  p.title,
  po.product_url,
  po.product_url as platform_product_url,
  po.affiliate_url,
  po.original_price,
  po.current_price as lowest_price,
  'INR'::text as currency,
  po.discount_percent,
  po.coupon_code,
  coalesce(po.delivery_info, 'See store') as delivery_info,
  coalesce(po.rating, 4.3) as rating,
  po.rating_count,
  po.review_count,
  po.is_hot_deal,
  (po.current_price = 0) as is_free_deal,
  false as is_lowest_price,
  po.availability,
  po.last_checked_at as last_updated,
  po.expires_at
from public.product_offers po
join public.products p on p.id = po.product_id
left join public.stores s on s.slug = po.store_slug
where po.status = 'active'
  and po.availability in ('in_stock', 'available', 'limited_stock')
  and po.current_price >= 0
  and (po.original_price <= 0 or po.current_price <= po.original_price)
  and (po.expires_at is null or po.expires_at > now())
  and coalesce(po.last_checked_at, po.updated_at, po.created_at) >= now() - interval '24 hours';

drop function if exists public.fallback_deal_image(text, text, text);
