-- Find and disable homepage-only price comparison URLs.
-- Price comparison rows must point to actual product/deal pages, not store homepages.

with invalid_urls(url) as (
  values
    ('https://amazon.in'),
    ('https://amazon.in/'),
    ('https://www.amazon.in'),
    ('https://www.amazon.in/'),
    ('https://flipkart.com'),
    ('https://flipkart.com/'),
    ('https://www.flipkart.com'),
    ('https://www.flipkart.com/'),
    ('https://meesho.com'),
    ('https://meesho.com/'),
    ('https://www.meesho.com'),
    ('https://www.meesho.com/'),
    ('https://myntra.com'),
    ('https://myntra.com/'),
    ('https://www.myntra.com'),
    ('https://www.myntra.com/'),
    ('https://ajio.com'),
    ('https://ajio.com/'),
    ('https://www.ajio.com'),
    ('https://www.ajio.com/'),
    ('https://croma.com'),
    ('https://croma.com/'),
    ('https://www.croma.com'),
    ('https://www.croma.com/'),
    ('https://nykaa.com'),
    ('https://nykaa.com/'),
    ('https://www.nykaa.com'),
    ('https://www.nykaa.com/')
)
select id, platform, product_url
from public.price_comparisons
where lower(trim(trailing '/' from product_url)) in (
  select lower(trim(trailing '/' from url)) from invalid_urls
);

with invalid_urls(url) as (
  values
    ('https://amazon.in'),
    ('https://www.amazon.in'),
    ('https://flipkart.com'),
    ('https://www.flipkart.com'),
    ('https://meesho.com'),
    ('https://www.meesho.com'),
    ('https://myntra.com'),
    ('https://www.myntra.com'),
    ('https://ajio.com'),
    ('https://www.ajio.com'),
    ('https://croma.com'),
    ('https://www.croma.com'),
    ('https://nykaa.com'),
    ('https://www.nykaa.com')
)
update public.price_comparisons
set is_available = false
where lower(trim(trailing '/' from product_url)) in (
  select lower(trim(trailing '/' from url)) from invalid_urls
);

with invalid_urls(url) as (
  values
    ('https://amazon.in'),
    ('https://amazon.in/'),
    ('https://www.amazon.in'),
    ('https://www.amazon.in/'),
    ('https://flipkart.com'),
    ('https://flipkart.com/'),
    ('https://www.flipkart.com'),
    ('https://www.flipkart.com/'),
    ('https://meesho.com'),
    ('https://meesho.com/'),
    ('https://www.meesho.com'),
    ('https://www.meesho.com/'),
    ('https://myntra.com'),
    ('https://myntra.com/'),
    ('https://www.myntra.com'),
    ('https://www.myntra.com/'),
    ('https://ajio.com'),
    ('https://ajio.com/'),
    ('https://www.ajio.com'),
    ('https://www.ajio.com/'),
    ('https://croma.com'),
    ('https://croma.com/'),
    ('https://www.croma.com'),
    ('https://www.croma.com/'),
    ('https://nykaa.com'),
    ('https://nykaa.com/'),
    ('https://www.nykaa.com'),
    ('https://www.nykaa.com/')
)
select id, platform, product_url
from public.price_comparison_platforms
where lower(trim(trailing '/' from product_url)) in (
  select lower(trim(trailing '/' from url)) from invalid_urls
);

with invalid_urls(url) as (
  values
    ('https://amazon.in'),
    ('https://www.amazon.in'),
    ('https://flipkart.com'),
    ('https://www.flipkart.com'),
    ('https://meesho.com'),
    ('https://www.meesho.com'),
    ('https://myntra.com'),
    ('https://www.myntra.com'),
    ('https://ajio.com'),
    ('https://www.ajio.com'),
    ('https://croma.com'),
    ('https://www.croma.com'),
    ('https://nykaa.com'),
    ('https://www.nykaa.com')
)
update public.price_comparison_platforms
set is_available = false,
    available = false
where lower(trim(trailing '/' from product_url)) in (
  select lower(trim(trailing '/' from url)) from invalid_urls
);
