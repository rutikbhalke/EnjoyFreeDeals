-- EnjoyFreeDeals verified price comparison seed template.
--
-- Run this only after manually verifying prices, URLs, coupons, and availability
-- from trusted source APIs or store pages. The app only displays comparison
-- groups with at least two available platforms.

create unique index if not exists price_comparisons_deal_unique_idx
  on public.price_comparisons (deal_id);

create unique index if not exists price_comparison_platform_unique_idx
  on public.price_comparison_platforms (comparison_id, lower(platform));

-- Example: seed a verified comparison for an existing active deal.
-- Replace the title match and platform values with manually verified data
-- before running. Placeholder rows are intentionally marked unavailable so an
-- accidental run cannot make fake comparisons appear in the app.
with source_deal as (
  select
    d.id,
    d.title,
    d.image_url,
    d.original_price,
    d.discounted_price,
    d.discount_percentage,
    d.affiliate_link,
    d.coupon_code,
    c.name as category_name,
    s.name as store_name
  from public.deals d
  left join public.categories c on c.id = d.category_id
  left join public.stores s on s.id = d.store_id
  where d.status = 'active'
    and (d.expiry_date is null or d.expiry_date > now())
    and d.title ilike '%REPLACE_WITH_DEAL_TITLE%'
  order by d.updated_at desc
  limit 1
),
comparison as (
  insert into public.price_comparisons (
    deal_id,
    product_name,
    image_url,
    category,
    original_price,
    lowest_price,
    discount_percentage,
    product_url,
    store_name,
    coupon_code,
    rating,
    is_hot_deal,
    is_free_deal,
    last_updated
  )
  select
    id,
    title,
    image_url,
    coalesce(category_name, ''),
    original_price,
    discounted_price,
    discount_percentage,
    affiliate_link,
    coalesce(store_name, ''),
    coupon_code,
    4.3,
    discount_percentage >= 50,
    discounted_price = 0,
    now()
  from source_deal
  on conflict (deal_id) do update set
    product_name = excluded.product_name,
    image_url = excluded.image_url,
    category = excluded.category,
    original_price = excluded.original_price,
    lowest_price = excluded.lowest_price,
    discount_percentage = excluded.discount_percentage,
    product_url = excluded.product_url,
    store_name = excluded.store_name,
    coupon_code = excluded.coupon_code,
    rating = excluded.rating,
    is_hot_deal = excluded.is_hot_deal,
    is_free_deal = excluded.is_free_deal,
    last_updated = now()
  returning id
),
platform_values(platform, price, product_url, affiliate_url, available, delivery_info, rating, coupon_code) as (
  values
    ('Amazon', 0, 'REPLACE_WITH_VERIFIED_AMAZON_URL', 'REPLACE_WITH_VERIFIED_AMAZON_AFFILIATE_URL', false, 'See store', 0, ''),
    ('Flipkart', 0, 'REPLACE_WITH_VERIFIED_FLIPKART_URL', 'REPLACE_WITH_VERIFIED_FLIPKART_AFFILIATE_URL', false, 'See store', 0, ''),
    ('Croma', 0, 'REPLACE_WITH_VERIFIED_CROMA_URL', 'REPLACE_WITH_VERIFIED_CROMA_AFFILIATE_URL', false, 'See store', 0, '')
)
insert into public.price_comparison_platforms (
  comparison_id,
  platform,
  price,
  product_url,
  affiliate_url,
  available,
  delivery_info,
  rating,
  coupon_code,
  last_updated
)
select
  comparison.id,
  platform_values.platform,
  platform_values.price,
  platform_values.product_url,
  platform_values.affiliate_url,
  platform_values.available,
  platform_values.delivery_info,
  platform_values.rating,
  platform_values.coupon_code,
  now()
from comparison
cross join platform_values
on conflict (comparison_id, lower(platform)) do update set
  price = excluded.price,
  product_url = excluded.product_url,
  affiliate_url = excluded.affiliate_url,
  available = excluded.available,
  delivery_info = excluded.delivery_info,
  rating = excluded.rating,
  coupon_code = excluded.coupon_code,
  last_updated = now();
