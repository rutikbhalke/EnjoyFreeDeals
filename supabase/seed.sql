-- EnjoyFreeDeals sample deals seed data.
-- Safe to run multiple times. Existing rows are matched by slug and updated.

insert into public.sample_whatsapp_otp_logins (mobile, otp_code, display_name, is_active)
values ('+919699353648', '123456', 'WhatsApp User', true)
on conflict (mobile) do update set
  otp_code = excluded.otp_code,
  display_name = excluded.display_name,
  is_active = excluded.is_active,
  updated_at = now();

with category_values(name, slug) as (
  values
    ('Electronics', 'electronics'),
    ('Mobile Deals', 'mobile'),
    ('Fashion', 'fashion'),
    ('Home & Kitchen', 'home'),
    ('Grocery', 'grocery'),
    ('Beauty', 'beauty'),
    ('Student Deals', 'student')
),
upsert_categories as (
  insert into public.categories (name, slug, is_active)
  select name, slug, true
  from category_values
  on conflict (slug) do update set
    name = excluded.name,
    is_active = true
  returning id, slug
),
store_values(name, slug, website_url, logo_url) as (
  values
    ('Amazon', 'amazon', 'https://www.amazon.in', 'https://www.google.com/s2/favicons?domain=amazon.in&sz=128'),
    ('Flipkart', 'flipkart', 'https://www.flipkart.com', 'https://www.google.com/s2/favicons?domain=flipkart.com&sz=128'),
    ('Myntra', 'myntra', 'https://www.myntra.com', 'https://www.google.com/s2/favicons?domain=myntra.com&sz=128'),
    ('Ajio', 'ajio', 'https://www.ajio.com', 'https://www.google.com/s2/favicons?domain=ajio.com&sz=128'),
    ('Croma', 'croma', 'https://www.croma.com', 'https://www.google.com/s2/favicons?domain=croma.com&sz=128'),
    ('JioMart', 'jiomart', 'https://www.jiomart.com', 'https://www.google.com/s2/favicons?domain=jiomart.com&sz=128'),
    ('Nykaa', 'nykaa', 'https://www.nykaa.com', 'https://www.google.com/s2/favicons?domain=nykaa.com&sz=128')
),
upsert_stores as (
  insert into public.stores (name, slug, website_url, logo_url, is_active)
  select name, slug, website_url, logo_url, true
  from store_values
  on conflict (slug) do update set
    name = excluded.name,
    website_url = excluded.website_url,
    logo_url = excluded.logo_url,
    is_active = true
  returning id, slug
),
deal_values(
  slug,
  title,
  description,
  store_slug,
  category_slug,
  original_price,
  discounted_price,
  discount_percentage,
  coupon_code,
  image_url,
  affiliate_link,
  source_product_id
) as (
  values
    (
      'amazon-boat-earbuds',
      'boAt Bluetooth Earbuds',
      'Deep bass wireless earbuds with fast charging case.',
      'amazon',
      'electronics',
      3999,
      1599,
      60,
      'BOAT60',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
      'https://www.amazon.in/dp/B0CBOAT60',
      'B0CBOAT60'
    ),
    (
      'flipkart-realme-phone',
      'Realme Smartphone',
      '5G smartphone offer with exchange and bank savings.',
      'flipkart',
      'mobile',
      16999,
      13599,
      20,
      'REALME20',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
      'https://www.flipkart.com/realme-5g-smartphone/p/itmrealme20',
      'itmrealme20'
    ),
    (
      'myntra-running-shoes',
      'Sports Shoes',
      'Lightweight running shoes with extra coupon savings.',
      'myntra',
      'fashion',
      3499,
      1575,
      55,
      'RUN55',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
      'https://www.myntra.com/sports-shoes/example-running-shoes/123456/buy',
      'myntra-123456'
    ),
    (
      'ajio-cotton-tshirt',
      'Men''s T-Shirt',
      'Premium cotton t-shirt with casual weekend pricing.',
      'ajio',
      'fashion',
      999,
      499,
      50,
      'AJIO50',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      'https://www.ajio.com/cotton-crew-neck-tshirt/p/ajio50',
      'ajio50'
    ),
    (
      'croma-bluetooth-speaker',
      'Bluetooth Speaker',
      'Portable speaker with punchy sound and compact design.',
      'croma',
      'electronics',
      2499,
      1749,
      30,
      'CROMA30',
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80',
      'https://www.croma.com/portable-bluetooth-speaker/p/123456',
      'croma-123456'
    ),
    (
      'jiomart-grocery-combo',
      'Grocery Combo',
      'Monthly grocery saver pack with staples and snacks.',
      'jiomart',
      'grocery',
      1999,
      1499,
      25,
      'GROCERY25',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
      'https://www.jiomart.com/p/groceries/monthly-grocery-combo/590001',
      'jiomart-590001'
    ),
    (
      'nykaa-beauty-combo',
      'Beauty Combo',
      'Skincare and makeup essentials combo offer.',
      'nykaa',
      'beauty',
      1999,
      1299,
      35,
      'BEAUTY35',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
      'https://www.nykaa.com/beauty-essentials-combo/p/beauty35',
      'beauty35'
    ),
    (
      'croma-student-laptop',
      'Student Laptop Deal',
      'Lightweight laptop with student exchange and bank discount.',
      'croma',
      'student',
      52999,
      44999,
      15,
      'STUDENT15',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
      'https://www.croma.com/student-laptop-deal/p/243156',
      'croma-243156'
    )
),
resolved_deals as (
  select
    deal_values.*,
    upsert_stores.id as store_id,
    upsert_categories.id as category_id
  from deal_values
  join upsert_stores on upsert_stores.slug = deal_values.store_slug
  join upsert_categories on upsert_categories.slug = deal_values.category_slug
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
  affiliate_link,
  image_url,
  now() + interval '7 days',
  'active',
  discount_percentage >= 50,
  true,
  'DISCOUNT',
  source_product_id,
  affiliate_link,
  'seed:' || slug,
  now(),
  jsonb_build_object(
    'connectorMode', 'html-scrape',
    'imageUrl', image_url,
    'jsonLdFound', true,
    'sourceKey', 'seed',
    'normalizedAt', now()
  )
from resolved_deals
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
