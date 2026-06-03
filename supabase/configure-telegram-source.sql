-- Configure the Telegram channel source for EnjoyFreeDeals imports.
--
-- Before running this:
--   1. Rotate the bot token if it was shared anywhere public.
--   2. Add @EnjoyFreeDeal_bot to the channel as an admin.
--   3. Set TELEGRAM_BOT_TOKEN as a Supabase Edge Function secret.
--
-- Private invite links cannot be resolved to a chat id by the Bot API. After the
-- bot receives its first channel post, check the import result/raw payload for
-- telegramChatId and place that value in config -> channelId for strict filtering.

alter table public.deal_sources add column if not exists config jsonb not null default '{}'::jsonb;

insert into public.deal_sources (
  source_key,
  source_name,
  source_type,
  base_url,
  secret_name,
  config,
  enabled,
  trust_level,
  run_interval_minutes
)
values (
  'telegram_enjoyfreedeals',
  'EnjoyFreeDeals Telegram',
  'telegram',
  'https://t.me/+X925uAMEGvgwOWY1',
  'TELEGRAM_BOT_TOKEN',
  jsonb_build_object(
    'inviteLink', 'https://t.me/+X925uAMEGvgwOWY1',
    'channelId', '',
    'expiryDays', 7,
    'pollLimit', 100
  ),
  true,
  5,
  15
)
on conflict (source_key) do update set
  source_name = excluded.source_name,
  source_type = excluded.source_type,
  base_url = excluded.base_url,
  secret_name = excluded.secret_name,
  config = public.deal_sources.config || excluded.config,
  enabled = true,
  trust_level = greatest(public.deal_sources.trust_level, excluded.trust_level),
  run_interval_minutes = excluded.run_interval_minutes,
  updated_at = now();
