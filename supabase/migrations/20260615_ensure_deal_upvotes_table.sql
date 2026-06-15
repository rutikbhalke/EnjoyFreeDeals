create extension if not exists pgcrypto;

create table if not exists public.deal_upvotes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid null,
  guest_id text null,
  ip_hash text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint deal_upvotes_identity_check check (
    user_id is not null or guest_id is not null or ip_hash is not null
  )
);

alter table public.deal_upvotes
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists deal_id uuid,
  add column if not exists user_id uuid null,
  add column if not exists guest_id text null,
  add column if not exists ip_hash text null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_deal_upvotes_deal_id on public.deal_upvotes(deal_id);
create index if not exists idx_deal_upvotes_user_id on public.deal_upvotes(user_id);
create index if not exists idx_deal_upvotes_guest_id on public.deal_upvotes(guest_id);
create index if not exists idx_deal_upvotes_ip_hash on public.deal_upvotes(ip_hash);

create unique index if not exists deal_upvotes_deal_user_unique
  on public.deal_upvotes(deal_id, user_id)
  where user_id is not null;

create unique index if not exists deal_upvotes_deal_guest_unique
  on public.deal_upvotes(deal_id, guest_id)
  where guest_id is not null;

create unique index if not exists deal_upvotes_deal_ip_hash_unique
  on public.deal_upvotes(deal_id, ip_hash)
  where ip_hash is not null;

alter table public.deals
  add column if not exists upvote_count integer default 0;

do $$
begin
  if to_regclass('public.upvoted_deals') is not null then
    execute $copy$
      insert into public.deal_upvotes (deal_id, user_id, guest_id, created_at, updated_at)
      select
        deal_id,
        case
          when user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then user_id::uuid
          else null
        end as user_id,
        case
          when user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then 'user:' || user_id
          else null
        end as guest_id,
        min(created_at),
        max(created_at)
      from public.upvoted_deals
      where deal_id is not null
      group by deal_id, user_id
      on conflict do nothing
    $copy$;
  end if;
end $$;

update public.deals d
set upvote_count = counts.total
from (
  select deal_id, count(*)::integer as total
  from public.deal_upvotes
  group by deal_id
) counts
where d.id = counts.deal_id;

alter table public.deal_upvotes enable row level security;

drop policy if exists "Service role can manage deal upvotes" on public.deal_upvotes;
create policy "Service role can manage deal upvotes"
on public.deal_upvotes for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

notify pgrst, 'reload schema';
