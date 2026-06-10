-- Development seed for price comparison data.
-- Run after supabase/migrations/20260610_price_comparison_feature.sql.

with selected_deals as (
  select
    d.id,
    coalesce(d.title, 'Product') as title,
    coalesce(d.image_url, d.final_image_url, '') as image_url,
    coalesce(d.original_price, 1999) as original_price,
    coalesce(d.discounted_price, 999) as deal_price,
    coalesce(d.affiliate_link, d.source_url, 'https://enjoyfreedeals-web.vercel.app/deals') as product_url,
    coalesce(d.coupon_code, '') as coupon_code,
    coalesce(c.name, 'Deals') as category
  from public.deals d
  left join public.categories c on c.id = d.category_id
  order by coalesce(d.updated_at, d.created_at) desc
  limit 5
),
comparison_rows as (
  insert into public.price_comparisons (
    deal_id,
    product_id,
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
    last_updated,
    updated_at
  )
  select
    id,
    id,
    title,
    image_url,
    category,
    original_price,
    899,
    55,
    product_url,
    'Meesho',
    coupon_code,
    4.2,
    true,
    false,
    now(),
    now()
  from selected_deals
  on conflict (deal_id) do update set
    lowest_price = excluded.lowest_price,
    store_name = excluded.store_name,
    last_updated = now(),
    updated_at = now()
  returning id as comparison_id, deal_id
),
platform_seed(platform, price, original_price, discount_percent, logo_url) as (
  values
    ('Amazon', 999::numeric, 1999::numeric, 50::numeric, 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'),
    ('Flipkart', 949::numeric, 1999::numeric, 52::numeric, 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-pre-login-3a7a30.svg'),
    ('Meesho', 899::numeric, 1899::numeric, 53::numeric, 'https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_Full.png'),
    ('Croma', 1049::numeric, 2099::numeric, 50::numeric, 'https://media-ik.croma.com/prod/https://media.croma.com/image/upload/v1664415872/Croma%20Assets/CMS/Homepage%20Banners/Croma_logo_hqvdqv.svg')
),
inserted_platforms as (
  insert into public.price_comparison_platforms (
    comparison_id,
    platform,
    platform_logo_url,
    product_url,
    affiliate_url,
    price,
    original_price,
    discount_percent,
    coupon_code,
    delivery_info,
    delivery_charge,
    rating,
    review_count,
    available,
    is_available,
    is_lowest_price,
    last_updated,
    last_checked_at
  )
  select
    cr.comparison_id,
    ps.platform,
    ps.logo_url,
    sd.product_url,
    sd.product_url,
    ps.price,
    ps.original_price,
    ps.discount_percent,
    sd.coupon_code,
    'Free delivery',
    0,
    4.2,
    0,
    true,
    true,
    ps.platform = 'Meesho',
    now(),
    now()
  from comparison_rows cr
  join selected_deals sd on sd.id = cr.deal_id
  cross join platform_seed ps
  on conflict do nothing
  returning comparison_id
)
update public.deals d
set
  lowest_price = 899,
  best_platform = 'Meesho',
  comparison_count = 4,
  last_price_checked_at = now()
where d.id in (select id from selected_deals);
