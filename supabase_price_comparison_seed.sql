-- Development seed for price comparison data.
-- Demo URLs are only for development. Real scraper/API data must save real product URLs.
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
    coalesce(c.name, 'Deals') as category,
    case
      when lower(coalesce(d.title, '') || ' ' || coalesce(c.name, '')) ~ 'watch|noise|smartwatch' then 'watch'
      when lower(coalesce(d.title, '') || ' ' || coalesce(c.name, '')) ~ 'mobile|phone|iphone|samsung|oneplus|realme|xiaomi| mi ' then 'mobile'
      when lower(coalesce(d.title, '') || ' ' || coalesce(c.name, '')) ~ 'beauty|skin|cream|serum|makeup|nykaa|purplle|mamaearth' then 'beauty'
      when lower(coalesce(d.title, '') || ' ' || coalesce(c.name, '')) ~ 'grocery|rice|atta|oil|snack|combo|basket|blinkit|zepto|jiomart' then 'grocery'
      when lower(coalesce(d.title, '') || ' ' || coalesce(c.name, '')) ~ 'shoe|sneaker|adidas|nike|puma|decathlon|fashion' then 'shoes'
      else 'earbuds'
    end as product_group
  from public.deals d
  left join public.categories c on c.id = d.category_id
  order by coalesce(d.updated_at, d.created_at) desc
  limit 10
),
platform_seed(product_group, platform, price, original_price, discount_percent, logo_url, product_url) as (
  values
    ('earbuds', 'Meesho', 899::numeric, 1899::numeric, 53::numeric, 'https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_Full.png', 'https://www.meesho.com/sample-product/p/demoearbuds1'),
    ('earbuds', 'Flipkart', 949::numeric, 1999::numeric, 52::numeric, 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-pre-login-3a7a30.svg', 'https://www.flipkart.com/sample-product/p/itmxxxxxxx'),
    ('earbuds', 'Amazon', 999::numeric, 1999::numeric, 50::numeric, 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'https://www.amazon.in/dp/B0XXXXXXX'),
    ('earbuds', 'Croma', 1049::numeric, 2099::numeric, 50::numeric, 'https://logo.clearbit.com/croma.com', 'https://www.croma.com/sample-product/p/300002'),
    ('earbuds', 'Boat', 1099::numeric, 2499::numeric, 56::numeric, 'https://logo.clearbit.com/boat-lifestyle.com', 'https://www.boat-lifestyle.com/products/sample-product'),
    ('earbuds', 'Reliance Digital', 1199::numeric, 2499::numeric, 52::numeric, 'https://logo.clearbit.com/reliancedigital.in', 'https://www.reliancedigital.in/sample-product/p/491000002'),

    ('watch', 'Noise', 1299::numeric, 4999::numeric, 74::numeric, 'https://logo.clearbit.com/gonoise.com', 'https://www.gonoise.com/products/sample-smart-watch'),
    ('watch', 'Flipkart', 1399::numeric, 4999::numeric, 72::numeric, 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-pre-login-3a7a30.svg', 'https://www.flipkart.com/sample-product/p/itmxxxxxxx'),
    ('watch', 'Amazon', 1499::numeric, 4999::numeric, 70::numeric, 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'https://www.amazon.in/dp/B0XXXXXXX'),
    ('watch', 'TataCliq', 1599::numeric, 4999::numeric, 68::numeric, 'https://logo.clearbit.com/tatacliq.com', 'https://www.tatacliq.com/sample-smart-watch/p-mp000000000'),
    ('watch', 'Reliance Digital', 1599::numeric, 4999::numeric, 68::numeric, 'https://logo.clearbit.com/reliancedigital.in', 'https://www.reliancedigital.in/sample-product/p/491000002'),
    ('watch', 'Croma', 1699::numeric, 4999::numeric, 66::numeric, 'https://logo.clearbit.com/croma.com', 'https://www.croma.com/sample-product/p/300002'),

    ('mobile', 'Flipkart', 12499::numeric, 18999::numeric, 34::numeric, 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-pre-login-3a7a30.svg', 'https://www.flipkart.com/sample-product/p/itmxxxxxxx'),
    ('mobile', 'JioMart', 12899::numeric, 18999::numeric, 32::numeric, 'https://logo.clearbit.com/jiomart.com', 'https://www.jiomart.com/p/electronics/sample-product/590000000'),
    ('mobile', 'Reliance Digital', 12949::numeric, 18999::numeric, 32::numeric, 'https://logo.clearbit.com/reliancedigital.in', 'https://www.reliancedigital.in/sample-product/p/491000002'),
    ('mobile', 'Amazon', 12999::numeric, 17999::numeric, 28::numeric, 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'https://www.amazon.in/dp/B0XXXXXXX'),
    ('mobile', 'Croma', 13299::numeric, 19999::numeric, 34::numeric, 'https://logo.clearbit.com/croma.com', 'https://www.croma.com/sample-product/p/300002'),
    ('mobile', 'TataCliq', 13499::numeric, 19999::numeric, 33::numeric, 'https://logo.clearbit.com/tatacliq.com', 'https://www.tatacliq.com/sample-smart-watch/p-mp000000000'),

    ('beauty', 'Purplle', 449::numeric, 899::numeric, 50::numeric, 'https://logo.clearbit.com/purplle.com', 'https://www.purplle.com/product/sample-vitamin-c-serum-30ml'),
    ('beauty', 'Nykaa', 499::numeric, 999::numeric, 50::numeric, 'https://logo.clearbit.com/nykaa.com', 'https://www.nykaa.com/sample-vitamin-c-serum/p/123456'),
    ('beauty', 'Mamaearth', 499::numeric, 999::numeric, 50::numeric, 'https://logo.clearbit.com/mamaearth.in', 'https://mamaearth.in/product/sample-vitamin-c-serum'),
    ('beauty', 'Flipkart', 519::numeric, 999::numeric, 48::numeric, 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-pre-login-3a7a30.svg', 'https://www.flipkart.com/sample-product/p/itmxxxxxxx'),
    ('beauty', 'Amazon', 529::numeric, 999::numeric, 47::numeric, 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'https://www.amazon.in/dp/B0XXXXXXX'),

    ('grocery', 'JioMart', 699::numeric, 999::numeric, 30::numeric, 'https://logo.clearbit.com/jiomart.com', 'https://www.jiomart.com/p/electronics/sample-product/590000000'),
    ('grocery', 'Zepto', 719::numeric, 999::numeric, 28::numeric, 'https://logo.clearbit.com/zeptonow.com', 'https://www.zeptonow.com/pn/sample-grocery-combo/pvid/demo123'),
    ('grocery', 'Blinkit', 729::numeric, 999::numeric, 27::numeric, 'https://logo.clearbit.com/blinkit.com', 'https://blinkit.com/prn/sample-grocery-combo/prid/123456'),
    ('grocery', 'Swiggy Instamart', 735::numeric, 999::numeric, 26::numeric, 'https://logo.clearbit.com/swiggy.com', 'https://www.swiggy.com/instamart'),
    ('grocery', 'BigBasket', 749::numeric, 999::numeric, 25::numeric, 'https://logo.clearbit.com/bigbasket.com', 'https://www.bigbasket.com/pd/123456/sample-grocery-combo'),
    ('grocery', 'Amazon', 799::numeric, 1099::numeric, 27::numeric, 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'https://www.amazon.in/dp/B0XXXXXXX'),

    ('shoes', 'Decathlon', 1699::numeric, 2999::numeric, 43::numeric, 'https://logo.clearbit.com/decathlon.in', 'https://www.decathlon.in/p/sample-running-shoes-8589090'),
    ('shoes', 'Puma', 1799::numeric, 3499::numeric, 49::numeric, 'https://logo.clearbit.com/puma.com', 'https://in.puma.com/in/en/pd/sample-running-shoes/390000'),
    ('shoes', 'Ajio', 1899::numeric, 3999::numeric, 53::numeric, 'https://logo.clearbit.com/ajio.com', 'https://www.ajio.com/sample-running-shoes/p/469000000_black'),
    ('shoes', 'Myntra', 1999::numeric, 3999::numeric, 50::numeric, 'https://logo.clearbit.com/myntra.com', 'https://www.myntra.com/sports-shoes/sample-brand/sample-running-shoes/12345678/buy'),
    ('shoes', 'Adidas', 2299::numeric, 4599::numeric, 50::numeric, 'https://logo.clearbit.com/adidas.co.in', 'https://www.adidas.co.in/sample-running-shoes/IF0000.html'),
    ('shoes', 'Nike', 2499::numeric, 4995::numeric, 50::numeric, 'https://logo.clearbit.com/nike.com', 'https://www.nike.com/in/t/sample-running-shoes-DM0000')
),
comparison_rows as (
  insert into public.price_comparisons (
    deal_id, product_id, product_name, image_url, category, original_price,
    lowest_price, discount_percentage, product_url, store_name, coupon_code,
    rating, is_hot_deal, is_free_deal, last_updated, updated_at
  )
  select
    sd.id, sd.id, sd.title, sd.image_url, sd.category, sd.original_price,
    min(ps.price), max(ps.discount_percent),
    (array_agg(ps.product_url order by ps.price asc))[1],
    (array_agg(ps.platform order by ps.price asc))[1],
    sd.coupon_code, 4.2, true, false, now(), now()
  from selected_deals sd
  join platform_seed ps on ps.product_group = sd.product_group
  group by sd.id, sd.title, sd.image_url, sd.category, sd.original_price, sd.coupon_code
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
  using comparison_rows cr
  where p.comparison_id = cr.comparison_id
  returning p.id
),
inserted_platforms as (
  insert into public.price_comparison_platforms (
    comparison_id, platform, platform_logo_url, product_url, affiliate_url,
    price, original_price, discount_percent, coupon_code, delivery_info,
    delivery_charge, rating, review_count, available, is_available,
    is_lowest_price, last_updated, last_checked_at
  )
  select
    cr.comparison_id, ps.platform, ps.logo_url, ps.product_url, ps.product_url,
    ps.price, ps.original_price, ps.discount_percent, sd.coupon_code,
    'Free delivery', 0, 4.2, 0, true, true,
    ps.price = min(ps.price) over (partition by sd.id),
    now(), now()
  from comparison_rows cr
  join selected_deals sd on sd.id = cr.deal_id
  join platform_seed ps on ps.product_group = sd.product_group
  returning comparison_id
)
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
  group by comparison_id
) counts on counts.comparison_id = pc.id
where d.id = pc.deal_id
  and d.id in (select id from selected_deals);
