create extension if not exists pgcrypto;

create table if not exists public.upvoted_deals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  deal_id uuid references public.deals(id) on delete cascade,
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

create index if not exists idx_upvoted_deals_user_id on public.upvoted_deals(user_id);
create index if not exists idx_upvoted_deals_deal_id on public.upvoted_deals(deal_id);
create index if not exists idx_upvoted_deals_created_at on public.upvoted_deals(created_at);

alter table public.deals
add column if not exists upvote_count integer default 0;

alter table public.upvoted_deals enable row level security;

drop policy if exists "Allow read upvoted deals" on public.upvoted_deals;
create policy "Allow read upvoted deals"
on public.upvoted_deals
for select
using (true);

drop policy if exists "Allow insert upvoted deals" on public.upvoted_deals;
create policy "Allow insert upvoted deals"
on public.upvoted_deals
for insert
with check (true);

drop policy if exists "Allow delete upvoted deals" on public.upvoted_deals;
create policy "Allow delete upvoted deals"
on public.upvoted_deals
for delete
using (true);

update public.deals d
set upvote_count = counts.total
from (
  select deal_id, count(*)::integer as total
  from public.upvoted_deals
  group by deal_id
) counts
where d.id = counts.deal_id;

notify pgrst, 'reload schema';
