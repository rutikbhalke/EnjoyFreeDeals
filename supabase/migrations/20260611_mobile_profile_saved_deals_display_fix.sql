-- Repair mobile profile action tables for the Android app.
-- Android stores mobile numbers (for example 9699353648) in user_id, so these
-- tables must use text user_id instead of auth.users uuid references.

create extension if not exists pgcrypto;

create table if not exists public.saved_deals (
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

create table if not exists public.shared_deals (
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

create table if not exists public.price_alerts (
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

create table if not exists public.recently_viewed_deals (
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

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conrelid::regclass as table_name, conname
    from pg_constraint
    where conrelid in (
      'public.saved_deals'::regclass,
      'public.shared_deals'::regclass,
      'public.price_alerts'::regclass,
      'public.recently_viewed_deals'::regclass
    )
      and contype = 'f'
  loop
    execute format('alter table %s drop constraint if exists %I', constraint_record.table_name, constraint_record.conname);
  end loop;
end $$;

drop policy if exists "Users manage own saved deals" on public.saved_deals;
drop policy if exists "Users manage own shared deals" on public.shared_deals;
drop policy if exists "Users manage own price alerts" on public.price_alerts;
drop policy if exists "Users manage own recently viewed deals" on public.recently_viewed_deals;
drop policy if exists "mobile saved deals access" on public.saved_deals;
drop policy if exists "mobile shared deals access" on public.shared_deals;
drop policy if exists "mobile price alerts access" on public.price_alerts;
drop policy if exists "mobile recently viewed access" on public.recently_viewed_deals;

alter table public.saved_deals alter column user_id type text using user_id::text;
alter table public.saved_deals alter column deal_id type text using deal_id::text;
alter table public.saved_deals add column if not exists product_title text;
alter table public.saved_deals add column if not exists platform text;
alter table public.saved_deals add column if not exists deal_price numeric;
alter table public.saved_deals add column if not exists original_price numeric;
alter table public.saved_deals add column if not exists discount_percent numeric;
alter table public.saved_deals add column if not exists product_url text;
alter table public.saved_deals add column if not exists image_url text;
alter table public.saved_deals alter column created_at drop not null;
alter table public.saved_deals alter column created_at set default now();

alter table public.shared_deals alter column user_id type text using user_id::text;
alter table public.shared_deals alter column deal_id type text using deal_id::text;
alter table public.shared_deals add column if not exists product_title text;
alter table public.shared_deals add column if not exists platform text;
alter table public.shared_deals add column if not exists deal_price numeric;
alter table public.shared_deals add column if not exists product_url text;
alter table public.shared_deals add column if not exists image_url text;
alter table public.shared_deals add column if not exists share_platform text;
alter table public.shared_deals add column if not exists shared_to text;
alter table public.shared_deals alter column created_at drop not null;
alter table public.shared_deals alter column created_at set default now();

alter table public.price_alerts alter column user_id type text using user_id::text;
alter table public.price_alerts alter column deal_id type text using deal_id::text;
alter table public.price_alerts add column if not exists product_title text;
alter table public.price_alerts add column if not exists platform text;
alter table public.price_alerts add column if not exists original_price numeric;
alter table public.price_alerts add column if not exists product_url text;
alter table public.price_alerts add column if not exists image_url text;
alter table public.price_alerts alter column created_at drop not null;
alter table public.price_alerts alter column created_at set default now();
alter table public.price_alerts alter column updated_at drop not null;
alter table public.price_alerts alter column updated_at set default now();

alter table public.recently_viewed_deals alter column user_id type text using user_id::text;
alter table public.recently_viewed_deals alter column deal_id type text using deal_id::text;
alter table public.recently_viewed_deals add column if not exists product_title text;
alter table public.recently_viewed_deals add column if not exists platform text;
alter table public.recently_viewed_deals add column if not exists deal_price numeric;
alter table public.recently_viewed_deals add column if not exists original_price numeric;
alter table public.recently_viewed_deals add column if not exists discount_percent numeric;
alter table public.recently_viewed_deals add column if not exists product_url text;
alter table public.recently_viewed_deals add column if not exists image_url text;
alter table public.recently_viewed_deals alter column viewed_at drop not null;
alter table public.recently_viewed_deals alter column viewed_at set default now();

create index if not exists idx_saved_deals_user_id on public.saved_deals(user_id);
create index if not exists idx_saved_deals_deal_id on public.saved_deals(deal_id);
create index if not exists idx_saved_deals_created_at on public.saved_deals(created_at);
create index if not exists idx_shared_deals_user_id on public.shared_deals(user_id);
create index if not exists idx_shared_deals_deal_id on public.shared_deals(deal_id);
create index if not exists idx_shared_deals_created_at on public.shared_deals(created_at);
create index if not exists idx_price_alerts_user_id on public.price_alerts(user_id);
create index if not exists idx_price_alerts_deal_id on public.price_alerts(deal_id);
create index if not exists idx_price_alerts_active on public.price_alerts(is_active);
create index if not exists idx_price_alerts_created_at on public.price_alerts(created_at);
create index if not exists idx_recently_viewed_user_id on public.recently_viewed_deals(user_id);
create index if not exists idx_recently_viewed_deal_id on public.recently_viewed_deals(deal_id);
create index if not exists idx_recently_viewed_viewed_at on public.recently_viewed_deals(viewed_at);

alter table public.saved_deals enable row level security;
alter table public.shared_deals enable row level security;
alter table public.price_alerts enable row level security;
alter table public.recently_viewed_deals enable row level security;

create policy "mobile saved deals access" on public.saved_deals for all using (true) with check (true);

create policy "mobile shared deals access" on public.shared_deals for all using (true) with check (true);

create policy "mobile price alerts access" on public.price_alerts for all using (true) with check (true);

create policy "mobile recently viewed access" on public.recently_viewed_deals for all using (true) with check (true);

notify pgrst, 'reload schema';
