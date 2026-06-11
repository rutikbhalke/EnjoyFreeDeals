-- EnjoyFreeDeals WhatsApp OTP test login support.
-- Run this in the Supabase SQL editor for the shared project.

create extension if not exists pgcrypto;

create table if not exists public.otp_verifications (
  id uuid primary key default gen_random_uuid(),
  mobile text not null,
  otp_code text,
  otp_hash text,
  expires_at timestamptz not null,
  used boolean default false,
  is_test_user boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.otp_verifications
  add column if not exists otp_code text,
  add column if not exists otp_hash text,
  add column if not exists used boolean default false,
  add column if not exists is_test_user boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.otp_verifications
  alter column otp_hash drop not null;

create index if not exists idx_otp_mobile on public.otp_verifications(mobile);
create index if not exists idx_otp_mobile_used on public.otp_verifications(mobile, used);

delete from public.otp_verifications
where mobile in ('9699353648', '919699353648');

insert into public.otp_verifications (
  mobile,
  otp_code,
  expires_at,
  used,
  is_test_user
)
values (
  '9699353648',
  '123457',
  now() + interval '365 days',
  false,
  true
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  mobile text unique,
  full_name text,
  email text,
  avatar_url text,
  login_provider text default 'mobile_otp',
  is_test_user boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists mobile text,
  add column if not exists login_provider text default 'mobile_otp',
  add column if not exists is_test_user boolean default false,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists profiles_mobile_unique_idx
on public.profiles(mobile)
where mobile is not null;

update public.profiles
set
  full_name = 'EnjoyFreeDeals Test User',
  login_provider = 'mobile_otp',
  is_test_user = true,
  updated_at = now()
where mobile = '9699353648';

insert into public.profiles (
  mobile,
  full_name,
  login_provider,
  is_test_user
)
select
  '9699353648',
  'EnjoyFreeDeals Test User',
  'mobile_otp',
  true
where not exists (
  select 1 from public.profiles where mobile = '9699353648'
);
