-- User deal actions for saved/shared/alerts/recent profile sections.

create table if not exists public.saved_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, deal_id)
);

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  target_price numeric not null,
  current_price numeric,
  is_active boolean not null default true,
  is_triggered boolean not null default false,
  triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, deal_id)
);

create table if not exists public.recently_viewed_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (user_id, deal_id)
);

alter table public.shared_deals add column if not exists shared_at timestamptz not null default now();

delete from public.shared_deals s
using public.shared_deals older
where s.user_id = older.user_id
  and s.deal_id = older.deal_id
  and coalesce(s.shared_at, s.created_at) < coalesce(older.shared_at, older.created_at);

create unique index if not exists shared_deals_user_deal_unique_idx on public.shared_deals (user_id, deal_id);
create index if not exists saved_deals_user_created_idx on public.saved_deals (user_id, created_at desc);
create index if not exists saved_deals_deal_idx on public.saved_deals (deal_id);
create index if not exists shared_deals_user_shared_idx on public.shared_deals (user_id, shared_at desc);
create index if not exists shared_deals_deal_idx on public.shared_deals (deal_id);
create index if not exists price_alerts_user_active_idx on public.price_alerts (user_id, is_active, updated_at desc);
create index if not exists price_alerts_deal_idx on public.price_alerts (deal_id);
create index if not exists recently_viewed_user_viewed_idx on public.recently_viewed_deals (user_id, viewed_at desc);
create index if not exists recently_viewed_deal_idx on public.recently_viewed_deals (deal_id);

insert into public.saved_deals (user_id, deal_id, created_at)
select user_id, deal_id, created_at
from public.deal_watchlist
on conflict (user_id, deal_id) do nothing;

insert into public.price_alerts (user_id, deal_id, target_price, current_price, is_active, is_triggered, triggered_at, created_at, updated_at)
select
  w.user_id,
  w.deal_id,
  w.target_price,
  d.discounted_price,
  w.target_price is not null,
  (w.target_price is not null and d.discounted_price <= w.target_price),
  case when w.target_price is not null and d.discounted_price <= w.target_price then now() else null end,
  w.created_at,
  now()
from public.deal_watchlist w
join public.deals d on d.id = w.deal_id
where w.target_price is not null
on conflict (user_id, deal_id) do update set
  target_price = excluded.target_price,
  current_price = excluded.current_price,
  is_active = true,
  is_triggered = excluded.is_triggered,
  triggered_at = excluded.triggered_at,
  updated_at = now();

update public.price_alerts pa
set
  current_price = d.discounted_price,
  is_triggered = case when pa.is_active and d.discounted_price <= pa.target_price then true else pa.is_triggered end,
  triggered_at = case
    when pa.is_active and d.discounted_price <= pa.target_price and pa.triggered_at is null then now()
    else pa.triggered_at
  end,
  updated_at = now()
from public.deals d
where d.id = pa.deal_id;

alter table public.saved_deals enable row level security;
alter table public.price_alerts enable row level security;
alter table public.recently_viewed_deals enable row level security;

drop policy if exists "Users manage own saved deals" on public.saved_deals;
create policy "Users manage own saved deals" on public.saved_deals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own price alerts" on public.price_alerts;
create policy "Users manage own price alerts" on public.price_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own recently viewed deals" on public.recently_viewed_deals;
create policy "Users manage own recently viewed deals" on public.recently_viewed_deals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

with detected_categories as (
  select
    d.id,
    case
      when lower(d.title || ' ' || d.source_url || ' ' || d.affiliate_link) ~ '(laptop|keyboard|mouse|monitor|notebook|macbook)' then 'laptop'
      when lower(d.title || ' ' || d.source_url || ' ' || d.affiliate_link) ~ '(mobile|smartphone|phone|charger|earbuds?|headphone|powerbank)' then 'mobile'
      when lower(d.title || ' ' || d.source_url || ' ' || d.affiliate_link) ~ '(shirt|jeans|shoes?|kurti|saree|dress|fashion|sneaker)' then 'fashion'
      when lower(d.title || ' ' || d.source_url || ' ' || d.affiliate_link) ~ '(shampoo|cream|makeup|skincare|beauty|serum|moisturiser)' then 'beauty'
      when lower(d.title || ' ' || d.source_url || ' ' || d.affiliate_link) ~ '(rice|oil|atta|grocery|snack|tea|coffee)' then 'grocery'
      when lower(d.title || ' ' || d.source_url || ' ' || d.affiliate_link) ~ '(mixer|bottle|pan|cooker|kitchen|container)' then 'home-and-kitchen'
      when lower(d.title || ' ' || d.source_url || ' ' || d.affiliate_link) ~ '(sofa|bedsheet|chair|decor|furniture|home)' then 'home-and-kitchen'
      when lower(d.title || ' ' || d.source_url || ' ' || d.affiliate_link) ~ '(appliance|washing machine|refrigerator|fridge|microwave|air conditioner)' then 'appliances'
      when lower(d.title || ' ' || d.source_url || ' ' || d.affiliate_link) ~ '(book|toy|game|kids)' then 'other-deals'
      when lower(d.source_url || ' ' || d.affiliate_link) ~ '(amazon|amzn\.to)' then 'amazon-deals'
      when lower(d.source_url || ' ' || d.affiliate_link) ~ '(flipkart|fkrt|flpkrt)' then 'flipkart-deals'
      else 'other-deals'
    end as category_slug
  from public.deals d
  left join public.categories existing on existing.id = d.category_id
  where d.category_id is null
    or existing.slug is null
    or existing.slug in ('general', 'other', 'other-deals')
)
update public.deals d
set category_id = c.id,
    updated_at = d.updated_at
from detected_categories dc
join public.categories c on c.slug = dc.category_slug
where d.id = dc.id;
