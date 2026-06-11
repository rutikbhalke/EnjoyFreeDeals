create table if not exists saved_deals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  deal_id text not null,
  product_title text,
  platform text,
  deal_price numeric,
  original_price numeric,
  discount_percent numeric,
  product_url text,
  image_url text,
  created_at timestamptz default now(),
  unique(user_id, deal_id)
);

create index if not exists idx_saved_deals_user_id on saved_deals(user_id);
create index if not exists idx_saved_deals_deal_id on saved_deals(deal_id);
create index if not exists idx_saved_deals_created_at on saved_deals(created_at);

create table if not exists shared_deals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  deal_id text not null,
  product_title text,
  platform text,
  deal_price numeric,
  product_url text,
  image_url text,
  share_platform text,
  shared_to text,
  created_at timestamptz default now()
);

create index if not exists idx_shared_deals_user_id on shared_deals(user_id);
create index if not exists idx_shared_deals_deal_id on shared_deals(deal_id);
create index if not exists idx_shared_deals_created_at on shared_deals(created_at);

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  deal_id text not null,
  product_title text,
  platform text,
  current_price numeric,
  target_price numeric not null,
  original_price numeric,
  product_url text,
  image_url text,
  is_active boolean default true,
  is_triggered boolean default false,
  triggered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, deal_id)
);

create index if not exists idx_price_alerts_user_id on price_alerts(user_id);
create index if not exists idx_price_alerts_deal_id on price_alerts(deal_id);
create index if not exists idx_price_alerts_active on price_alerts(is_active);
create index if not exists idx_price_alerts_created_at on price_alerts(created_at);

create table if not exists recently_viewed_deals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  deal_id text not null,
  product_title text,
  platform text,
  deal_price numeric,
  original_price numeric,
  discount_percent numeric,
  product_url text,
  image_url text,
  viewed_at timestamptz default now(),
  unique(user_id, deal_id)
);

create index if not exists idx_recently_viewed_user_id on recently_viewed_deals(user_id);
create index if not exists idx_recently_viewed_deal_id on recently_viewed_deals(deal_id);
create index if not exists idx_recently_viewed_viewed_at on recently_viewed_deals(viewed_at);

alter table shared_deals add column if not exists image_url text;

alter table saved_deals enable row level security;
alter table shared_deals enable row level security;
alter table price_alerts enable row level security;
alter table recently_viewed_deals enable row level security;

drop policy if exists "mobile saved deals access" on saved_deals;
create policy "mobile saved deals access"
on saved_deals for all
using (true)
with check (true);

drop policy if exists "mobile shared deals access" on shared_deals;
create policy "mobile shared deals access"
on shared_deals for all
using (true)
with check (true);

drop policy if exists "mobile price alerts access" on price_alerts;
create policy "mobile price alerts access"
on price_alerts for all
using (true)
with check (true);

drop policy if exists "mobile recently viewed access" on recently_viewed_deals;
create policy "mobile recently viewed access"
on recently_viewed_deals for all
using (true)
with check (true);

notify pgrst, 'reload schema';
