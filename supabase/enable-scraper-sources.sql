-- Switch existing source rows from API placeholder mode to scrape mode.
-- Run this in Supabase SQL editor when you want the Edge Function to scrape
-- original product URLs before affiliate APIs are connected.

update public.deal_sources
set
  source_type = 'scrape',
  secret_name = '',
  trust_level = least(trust_level, 4),
  updated_at = now()
where source_key in ('amazon', 'flipkart', 'myntra', 'ajio', 'croma', 'tatacliq');
