create extension if not exists pgcrypto;

alter table public.deals add column if not exists fallback_image_url text;
alter table public.deals add column if not exists final_image_url text;
alter table public.deals add column if not exists deal_score integer not null default 0;
alter table public.deals add column if not exists is_super_hot_deal boolean not null default false;
alter table public.deals add column if not exists is_best_price boolean not null default false;
alter table public.deals add column if not exists telegram_channel text;
alter table public.deals add column if not exists telegram_message_id text;
alter table public.deals add column if not exists message_text text;

create index if not exists idx_deals_deal_score on public.deals(deal_score);
create index if not exists idx_deals_telegram_channel on public.deals(telegram_channel);
create index if not exists idx_deals_telegram_message_id on public.deals(telegram_message_id);
create index if not exists idx_deals_final_image_url on public.deals(final_image_url);
create index if not exists idx_deals_telegram_channel_message
on public.deals(telegram_channel, telegram_message_id);

insert into storage.buckets (id, name, public)
values ('deal-images', 'deal-images', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read deal images'
  ) then
    create policy "Public can read deal images"
    on storage.objects for select
    using (bucket_id = 'deal-images');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Service role can manage deal images'
  ) then
    create policy "Service role can manage deal images"
    on storage.objects for all
    using (bucket_id = 'deal-images' and auth.role() = 'service_role')
    with check (bucket_id = 'deal-images' and auth.role() = 'service_role');
  end if;
end $$;
