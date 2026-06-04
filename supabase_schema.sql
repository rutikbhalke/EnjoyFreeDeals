create extension if not exists pgcrypto;

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  platform text,
  product_title text not null,
  category text,
  original_price numeric,
  deal_price numeric not null,
  discount_percent numeric,
  coupon_code text,
  product_url text not null,
  image_url text,
  rating numeric,
  review_count integer,
  delivery_charge numeric,
  is_free_deal boolean default false,
  is_coupon_deal boolean default false,
  is_hot_deal boolean default false,
  is_super_hot_deal boolean default false,
  is_best_price boolean default false,
  deal_score integer default 0,
  scraped_from_channel text,
  telegram_message_id text,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saved_deals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  deal_id uuid references public.deals(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, deal_id)
);

create table if not exists public.otp_verifications (
  id uuid primary key default gen_random_uuid(),
  mobile text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_deals_platform on public.deals(platform);
create index if not exists idx_deals_category on public.deals(category);
create index if not exists idx_deals_discount_percent on public.deals(discount_percent);
create index if not exists idx_deals_deal_score on public.deals(deal_score);
create index if not exists idx_deals_is_active on public.deals(is_active);
create index if not exists idx_saved_deals_user_id on public.saved_deals(user_id);
create index if not exists idx_otp_verifications_mobile on public.otp_verifications(mobile);

alter table public.deals enable row level security;
alter table public.saved_deals enable row level security;
alter table public.otp_verifications enable row level security;

create policy "Public can read active deals"
on public.deals for select
using (is_active = true);

create policy "Service role can manage deals"
on public.deals for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Service role can manage saved deals"
on public.saved_deals for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Service role can manage otp verifications"
on public.otp_verifications for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
