-- Development seed: add multiple platform comparison rows for existing deals.
-- Demo URLs are actual-looking product paths for UI testing only.
-- Real production comparison rows must use verified platform product URLs.

with selected_deals as (
  select
    d.id,
    coalesce(d.title, 'demo-product') as title,
    greatest(coalesce(d.discounted_price, d.lowest_price, 999), 50) as deal_price,
    greatest(coalesce(d.original_price, d.discounted_price * 2, 1999), coalesce(d.discounted_price, 999)) as original_price,
    coalesce(d.image_url, d.final_image_url, '') as image_url,
    coalesce(c.name, 'Deals') as category,
    coalesce(d.coupon_code, '') as coupon_code
  from public.deals d
  left join public.categories c on c.id = d.category_id
  where coalesce(d.status, 'active') = 'active'
  order by coalesce(d.updated_at, d.created_at) desc
  limit 10
),
comparison_parent as (
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
    greatest(deal_price - 50, 1),
    case when original_price > 0 then round(((original_price - greatest(deal_price - 50, 1)) / original_price) * 100, 2) else null end,
    'https://www.meesho.com/demo-product/p/demo',
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
    product_url = excluded.product_url,
    last_updated = now(),
    updated_at = now()
  returning id as comparison_id, deal_id
),
cleared_platforms as (
  delete from public.price_comparison_platforms p
  using comparison_parent cp
  where p.comparison_id = cp.comparison_id
  returning p.id
),
platform_rows as (
  select cp.comparison_id, sd.id as deal_id, sd.original_price, sd.coupon_code, 'Meesho' as platform, greatest(sd.deal_price - 50, 1) as price, 'https://www.meesho.com/demo-product/p/demo' as product_url
  from comparison_parent cp join selected_deals sd on sd.id = cp.deal_id
  union all
  select cp.comparison_id, sd.id, sd.original_price, sd.coupon_code, 'Flipkart', sd.deal_price + 50, 'https://www.flipkart.com/demo-product/p/demo'
  from comparison_parent cp join selected_deals sd on sd.id = cp.deal_id
  union all
  select cp.comparison_id, sd.id, sd.original_price, sd.coupon_code, 'Amazon', sd.deal_price + 100, 'https://www.amazon.in/dp/B0DEMO1234'
  from comparison_parent cp join selected_deals sd on sd.id = cp.deal_id
  union all
  select cp.comparison_id, sd.id, sd.original_price, sd.coupon_code, 'Croma', sd.deal_price + 150, 'https://www.croma.com/demo-product/p/demo'
  from comparison_parent cp join selected_deals sd on sd.id = cp.deal_id
  union all
  select cp.comparison_id, sd.id, sd.original_price, sd.coupon_code, 'Reliance Digital', sd.deal_price + 200, 'https://www.reliancedigital.in/demo-product/p/491000000'
  from comparison_parent cp join selected_deals sd on sd.id = cp.deal_id
)
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
  comparison_id,
  platform,
  case
    when platform = 'Amazon' then 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
    when platform = 'Flipkart' then 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-pre-login-3a7a30.svg'
    when platform = 'Meesho' then 'https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_Full.png'
    when platform = 'Croma' then 'https://logo.clearbit.com/croma.com'
    else 'https://logo.clearbit.com/reliancedigital.in'
  end,
  product_url,
  product_url,
  price,
  original_price,
  case when original_price > 0 then round(((original_price - price) / original_price) * 100, 2) else null end,
  coupon_code,
  'See store',
  0,
  4.2,
  0,
  true,
  true,
  price = min(price) over (partition by deal_id),
  now(),
  now()
from platform_rows;

update public.deals d
set
  lowest_price = pc.lowest_price,
  best_platform = pc.store_name,
  comparison_count = counts.platform_count,
  last_price_checked_at = now()
from public.price_comparisons pc
join (
  select comparison_id, count(*) as platform_count
  from public.price_comparison_platforms
  where available = true
  group by comparison_id
) counts on counts.comparison_id = pc.id
where d.id = pc.deal_id
  and d.id in (select id from selected_deals);
