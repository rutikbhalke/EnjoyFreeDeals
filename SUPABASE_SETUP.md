# EnjoyFreeDeals Supabase Setup

## Android Local Configuration

Add these values to `local.properties`:

```properties
SUPABASE_URL=https://pzgyphnerjatlqlvvvsl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Z3lwaG5lcmphdGxxbHZ2dnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODAyODIsImV4cCI6MjA4NzE1NjI4Mn0.DJjMdi_LMo6iKX8JRRlxtgKl8Abfeb-9qcd9gJG5ijE
```

Only the anon key belongs in Android. Keep the service role key out of the app.

## Database Schema

Open Supabase Dashboard > SQL Editor, paste the contents of `enjoyfreedeals_supabase_schema.sql`, then run it.

The Android app reads from:

- `active_deals`
- `price_comparison`
- `product_price_stats`
- `price_history`
- `saved_deals`
- `price_alerts`

The app intentionally reads `active_deals` for visible deal lists so expired and out-of-stock deals are hidden by the backend/view.

## Realtime

Enable Realtime for the `product_offers` table in Supabase:

1. Open Database > Replication.
2. Enable Realtime for `public.product_offers`.
3. The Android app subscribes to `product_offers` changes and refreshes visible deal data when a change arrives.

## Edge Function Secrets

Set secrets for the `fetch-live-deals` Edge Function:

```bash
supabase secrets set AMAZON_API_KEY=your_value
supabase secrets set FLIPKART_API_KEY=your_value
supabase secrets set MEESHO_API_KEY=your_value
supabase secrets set MYNTRA_API_KEY=your_value
supabase secrets set AJIO_API_KEY=your_value
supabase secrets set TATACLIQ_API_KEY=your_value
supabase secrets set CROMA_API_KEY=your_value
supabase secrets set NYKAA_API_KEY=your_value
supabase secrets set SNAPDEAL_API_KEY=your_value
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deploy Edge Function

```bash
supabase functions deploy fetch-live-deals --project-ref pzgyphnerjatlqlvvvsl
```

## 1-Minute Backend Refresh

Use a Supabase scheduled job or external scheduler to invoke the Edge Function every 1 minute. The Android app does not poll every minute.

Suggested scheduled tasks:

- Invoke `fetch-live-deals` every 1 minute.
- Run `select public.cleanup_expired_deals();` every 1 minute.

If using `pg_cron`, run a schedule similar to:

```sql
select cron.schedule(
  'cleanup-expired-deals-every-minute',
  '* * * * *',
  $$select public.cleanup_expired_deals();$$
);
```

For the Edge Function trigger, use Supabase scheduled functions if enabled for your project, or an external scheduler that calls:

```text
https://pzgyphnerjatlqlvvvsl.functions.supabase.co/fetch-live-deals
```

with the required function authorization.
