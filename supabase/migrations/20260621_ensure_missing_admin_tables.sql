-- Ensure tables used by the app are present in the admin database checker.
-- Safe to rerun: all table, column, index, and policy statements are additive/idempotent.

create extension if not exists pgcrypto;

create table if not exists public.otp_verifications (
  id uuid primary key default gen_random_uuid(),
  mobile text not null,
  otp_code text,
  otp_hash text,
  expires_at timestamptz not null,
  used boolean not null default false,
  is_test_user boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.otp_verifications
  add column if not exists mobile text,
  add column if not exists otp_code text,
  add column if not exists otp_hash text,
  add column if not exists expires_at timestamptz,
  add column if not exists used boolean not null default false,
  add column if not exists is_test_user boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.otp_verifications
  alter column otp_hash drop not null;

create index if not exists idx_otp_verifications_mobile
  on public.otp_verifications(mobile);
create index if not exists idx_otp_verifications_mobile_used
  on public.otp_verifications(mobile, used);

create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  deal_id uuid references public.deals(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  search_query text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_activity
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists event_type text,
  add column if not exists deal_id uuid references public.deals(id) on delete set null,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists store_id uuid references public.stores(id) on delete set null,
  add column if not exists search_query text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create index if not exists user_activity_user_created_idx
  on public.user_activity(user_id, created_at desc);
create index if not exists user_activity_deal_event_idx
  on public.user_activity(deal_id, event_type, created_at desc);
create index if not exists user_activity_category_created_idx
  on public.user_activity(category_id, created_at desc);
create index if not exists user_activity_store_created_idx
  on public.user_activity(store_id, created_at desc);

alter table public.otp_verifications enable row level security;
alter table public.user_activity enable row level security;

drop policy if exists "Service role can manage otp verifications" on public.otp_verifications;
create policy "Service role can manage otp verifications" on public.otp_verifications
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Users insert own activity" on public.user_activity;
create policy "Users insert own activity" on public.user_activity
  for insert to anon, authenticated with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Users read own activity" on public.user_activity;
create policy "Users read own activity" on public.user_activity
  for select to authenticated using (auth.uid() = user_id);

notify pgrst, 'reload schema';
