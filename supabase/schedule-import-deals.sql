-- Schedule the import-deals Edge Function to run once every hour.
--
-- Replace these placeholders before running in the Supabase SQL editor:
--   <PROJECT_REF>              Example: pzgyphnerjatlqlvvvsl
--   <FUNCTION_BEARER_TOKEN>    Prefer a server-side service role token or a token accepted by the function JWT setting.
--   <IMPORT_DEALS_CRON_SECRET> Same value set as the Edge Function secret IMPORT_DEALS_CRON_SECRET.
--
-- This file intentionally contains no real secrets.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('import-deals-hourly');
exception
  when others then null;
end $$;

select cron.schedule(
  'import-deals-hourly',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/import-deals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <FUNCTION_BEARER_TOKEN>',
        'x-import-secret', '<IMPORT_DEALS_CRON_SECRET>'
      ),
      body := jsonb_build_object(
        'scheduled', true
      )
    ) as request_id;
  $$
);
