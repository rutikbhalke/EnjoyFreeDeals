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
  add column if not exists upvote_count integer default 0,
  add column if not exists price_range_min numeric null,
  add column if not exists price_range_max numeric null,
  add column if not exists admin_notes text null,
  add column if not exists validation_flags jsonb default '[]'::jsonb,
  add column if not exists approved_at timestamptz null,
  add column if not exists rejected_at timestamptz null,
  add column if not exists approved_by text null,
  add column if not exists rejected_reason text null,
  add column if not exists availability text null,
  add column if not exists source_url text not null default '',
  add column if not exists source_image_url text,
  add column if not exists final_image_url text,
  add column if not exists platform_product_url text,
  add column if not exists source_type text default 'manual',
  add column if not exists source_channel text,
  add column if not exists telegram_post_url text,
  add column if not exists price_status text default 'detected',
  add column if not exists price_min numeric,
  add column if not exists price_max numeric,
  add column if not exists manual_price_note text,
  add column if not exists expiry_status text default 'detected',
  add column if not exists expiry_at timestamptz,
  add column if not exists expiry_note text,
  add column if not exists admin_review_status text default 'approved',
  add column if not exists scrape_status text default 'success',
  add column if not exists is_expired boolean default false,
  add column if not exists is_valid boolean default true,
  add column if not exists last_scraped_at timestamptz;

alter table public.deals alter column status type text using status::text;
alter table public.deals alter column status set default 'approved';

create index if not exists idx_deals_admin_status on public.deals(status);
create index if not exists idx_deals_validation_flags on public.deals using gin(validation_flags);
create index if not exists idx_deals_price_range on public.deals(price_range_min, price_range_max);
create index if not exists idx_deals_admin_review_status on public.deals(admin_review_status);
create index if not exists idx_deals_source_type on public.deals(source_type);
create index if not exists idx_deals_source_channel on public.deals(source_channel);
create index if not exists idx_deals_price_status on public.deals(price_status);
create index if not exists idx_deals_is_expired on public.deals(is_expired);

do $$
begin
  if to_regclass('public.upvoted_deals') is not null then
    execute $copy$
      insert into public.deal_upvotes (deal_id, user_id, guest_id, created_at, updated_at)
      select
        deal_id,
        case
          when user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then user_id::uuid
          else null
        end as user_id,
        case
          when user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
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

update public.deals d
set validation_flags = flags.flags,
    admin_review_status = case
      when jsonb_array_length(flags.flags) > 0 and coalesce(d.admin_review_status, 'approved') = 'approved'
        then 'needs_review'
      else d.admin_review_status
    end,
    status = case
      when jsonb_array_length(flags.flags) > 0 and coalesce(d.status, 'approved') in ('approved', 'active')
        then 'pending_review'
      else d.status
    end,
    is_valid = case
      when jsonb_array_length(flags.flags) > 0 then false
      else coalesce(d.is_valid, true)
    end
from (
  select
    id,
    to_jsonb(array_remove(array[
      case when coalesce(nullif(image_url, ''), nullif(final_image_url, ''), nullif(source_image_url, '')) is null then 'missing_image' end,
      case when discounted_price is null then 'missing_price' end,
      case when discounted_price = 0 then 'zero_price' end,
      case when discounted_price < 0 or original_price < 0 then 'invalid_price' end,
      case when original_price > 0 and discounted_price > original_price then 'price_mismatch' end,
      case when category_id is null then 'missing_category' end,
      case when coalesce(nullif(title, ''), '') = '' then 'missing_title' end,
      case when coalesce(nullif(affiliate_link, ''), nullif(source_url, ''), nullif(platform_product_url, '')) is null then 'missing_product_url' end,
      case when coalesce(source_type, '') = 'telegram' and coalesce(admin_review_status, '') in ('needs_review', 'pending_review') then 'suspicious_telegram' end
    ]::text[], null)) as flags
  from public.deals
) flags
where d.id = flags.id
  and jsonb_array_length(flags.flags) > 0;

alter table public.deal_upvotes enable row level security;

drop policy if exists "Service role can manage deal upvotes" on public.deal_upvotes;
create policy "Service role can manage deal upvotes"
on public.deal_upvotes for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

notify pgrst, 'reload schema';
