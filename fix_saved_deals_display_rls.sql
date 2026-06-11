create extension if not exists pgcrypto;

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

alter table saved_deals add column if not exists product_title text;
alter table saved_deals add column if not exists platform text;
alter table saved_deals add column if not exists deal_price numeric;
alter table saved_deals add column if not exists original_price numeric;
alter table saved_deals add column if not exists discount_percent numeric;
alter table saved_deals add column if not exists product_url text;
alter table saved_deals add column if not exists image_url text;
create index if not exists idx_saved_deals_user_id on saved_deals(user_id);
create index if not exists idx_saved_deals_deal_id on saved_deals(deal_id);
create index if not exists idx_saved_deals_created_at on saved_deals(created_at);

alter table saved_deals enable row level security;

drop policy if exists "Allow read saved deals" on saved_deals;
create policy "Allow read saved deals"
on saved_deals
for select
using (true);

drop policy if exists "Allow insert saved deals" on saved_deals;
create policy "Allow insert saved deals"
on saved_deals
for insert
with check (true);

drop policy if exists "Allow delete saved deals" on saved_deals;
create policy "Allow delete saved deals"
on saved_deals
for delete
using (true);

notify pgrst, 'reload schema';
