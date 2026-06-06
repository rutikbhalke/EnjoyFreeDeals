# EnjoyFreeDeals

EnjoyFreeDeals contains a Kotlin Android app and a Node/Express backend for server-side Supabase access.

## Backend Setup

1. Install backend dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in real Supabase values:

```env
SUPABASE_URL=https://pzgyphnerjatlqlvvvsl.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_ID=pzgyphnerjatlqlvvvsl
PORT=5000
```

3. Ask the Supabase owner to run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor if any missing app or scraper tables need to be added.

4. Start the backend:

```bash
npm run dev
```

The API runs on `http://localhost:5000` by default.

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is used only by backend server code.
- Do not put the service role key in Android, frontend code, Git, or public logs.
- Android should call this backend API, not Supabase directly.
- Admin routes require a Supabase user JWT with `role: "admin"` in user/app metadata, or a matching row in `user_roles`.

## API Routes

- `POST /api/auth/whatsapp/request-otp`
  - Body: `mobile`
- `POST /api/auth/whatsapp/verify-otp`
  - Body: `mobile`, `otp`; optional `name`, `email`
- `GET /api/auth/me`
  - Requires `Authorization: Bearer <accessToken>`
- `GET /api/deals`
  - Query params: `search`, `category`, `dealType`, `limit`, `page`
- `GET /api/deals/:id`
- `GET /api/deals/:id/price-history`
- `POST /api/deals`
  - Admin only
- `PUT /api/deals/:id`
  - Admin only
- `DELETE /api/deals/:id`
  - Admin only; soft deletes with `is_active=false`
- `GET /api/categories`
- `GET /api/blogs`
- `POST /api/wishlist`
- `GET /api/wishlist/:userId`
- `DELETE /api/wishlist/:userId/:dealId`
- `POST /api/shared-deals`
- `GET /api/shared-deals/:userId`
- `POST /api/price-alerts`
- `DELETE /api/price-alerts/:userId/:dealId`
- `GET /api/price-comparisons`
- `GET /api/price-comparisons/:productId`
- `GET /api/admin/scraped-deals`
  - Admin only; query params: `status`, `sourceKey`, `limit`, `page`
- `POST /api/admin/scraped-deals/:id/approve`
  - Admin only
- `POST /api/admin/scraped-deals/:id/reject`
  - Admin only; body: `reason`
- `GET /api/admin/scrape-all-deals`
  - Import-protected; scrapes configured Telegram preview pages, enriches product pages for real images/prices, and starts a background job by default.
- `GET /api/admin/genie-loot-jobs/:id`
  - Import-protected; checks scrape/enrichment job status.
- `GET /api/profiles/:userId`
- `PUT /api/profiles/:userId`
- `GET /api/notifications/:userId`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/user/:userId/read-all`
- `GET /api/health/supabase`

## Live Supabase Table Mapping

- Deals: `deals` joined with `categories` and `stores`
- Categories: `categories`
- Blogs: `blog_posts`
- Wishlist and price alerts: `deal_watchlist`
- Shared deal history: `shared_deals`
- Price comparisons: `price_comparisons` joined with `price_comparison_platforms`
- Profiles: `profiles`
- Notifications: `notifications`
- Admin roles: `user_roles`
- Scraper support: `scraper_jobs`, `deal_sources`, `scraped_deal_items`

## Price Comparison Data

The backend only returns price-comparison groups that have at least two available platforms with valid prices. If the `price_comparisons` table is empty, or a product has only one store price, Android hides the comparison section instead of showing placeholder copy.

To add verified comparison data, ask the Supabase owner to edit and run [supabase/seed-price-comparisons.sql](supabase/seed-price-comparisons.sql) in the Supabase SQL editor after checking prices, URLs, coupons, and availability from trusted sources.

## Deal Scraper Automation

The smart deal importer runs server-side as a Supabase Edge Function. Android does not call it and never receives scraper credentials or the Supabase service role key.

### Files

- `supabase/functions/import-deals/` contains the hourly importer.
- `supabase/schedule-import-deals.sql` schedules the function with Supabase Cron.
- `supabase/schema.sql` contains the required scraper tables and trusted source seed data.

### Behavior

- Reads enabled sources from `deal_sources`.
- Scrapes configured original source URLs when `deal_sources.source_type='scrape'`.
- Polls Telegram channel posts when `deal_sources.source_type='telegram'`.
- Keeps `affiliate_link` equal to the original product URL until affiliate APIs/links are added later.
- Normalizes source items into the existing `deals` table.
- Deduplicates by `dedupe_key`.
- Writes every attempt into `scraped_deal_items`.
- Records each run in `scraper_jobs`.
- Adds `price_history` rows only when a deal is new or the price changes.
- Builds price-comparison groups only after the same product is found on at least two distinct platforms.
- Auto-publishes only valid high-trust deals with `status='active'`.
- Stores suspicious or low-trust deals as `status='pending'`, so they do not appear in `GET /api/deals`.

### Scraping Mode Before Affiliate APIs

For the current no-affiliate phase, run [supabase/enable-scraper-sources.sql](supabase/enable-scraper-sources.sql) in the Supabase SQL editor. Then configure product/listing seed URLs as Edge Function secrets:

```bash
supabase secrets set SCRAPER_SEED_URLS_AMAZON="https://www.amazon.in/dp/PRODUCT_ID"
supabase secrets set SCRAPER_SEED_URLS_FLIPKART="https://www.flipkart.com/product/p/itm..."
```

Use comma-separated URLs for multiple pages. The scraper stores original URLs now; later, affiliate connectors can replace `affiliate_link` while keeping `source_url` as the canonical original URL.

Scraped deals with weak quality signals are stored as `pending` or `needs_review`. Admin users can review them through `/api/admin/scraped-deals` and approve or reject individual items.

### Telegram Channel Imports

Telegram channel imports are server-side only. Do not put the bot token in Android.

1. If the bot token was shared in chat or screenshots, rotate it in BotFather first.
2. Add `@EnjoyFreeDeal_bot` to the Telegram channel as an admin so the bot receives future channel posts.
3. Run [supabase/configure-telegram-source.sql](supabase/configure-telegram-source.sql) in the Supabase SQL editor to add the `telegram_enjoyfreedeals` source for `https://t.me/+X925uAMEGvgwOWY1`.
4. Set the new bot token as an Edge Function secret:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=your_new_bot_token
```

The Bot API cannot fetch private-channel history from an invite link. It can import new posts after the bot is added to the channel. After the first imported post, the raw payload includes `telegramChatId`; place that value in `deal_sources.config.channelId` or `TELEGRAM_ALLOWED_CHAT_IDS` to strictly filter the selected channel.

This importer uses Telegram `getUpdates` polling. If a webhook was previously set on the bot, remove it before deploying this importer.

For local backend testing, set `TELEGRAM_BOT_TOKEN` in `.env`, restart the backend, add the bot as a channel admin, post a fresh deal message, then open:

```text
http://127.0.0.1:5000/api/admin/import-telegram
```

The endpoint returns `updateCount` and `dealCount`. `updateCount: 0` means Telegram has not delivered any new posts to the bot yet. Imported Telegram deals appear in `GET /api/deals`.

For public Telegram preview pages, the backend can scrape `t.me/s/...` pages directly. The Genie Loot invite link is private, so the default scraper uses the public preview page discovered for Genie Loot-related deal posts:

```text
http://127.0.0.1:5000/api/admin/scrape-genie-loot?maxPages=25
```

By default the local backend now scrapes these public Telegram channels together:

```text
https://t.me/s/India_loot_deals
https://t.me/s/king_deal_1
https://t.me/s/icoolzTricks
```

Set `GENIE_LOOT_PAGE_URLS` to change that list. The scraper ranks all parsed posts and imports only the best 3 out of every 10 candidates by highest discount, then lowest deal price, so the app feed focuses on the cheapest high-value deals instead of every Telegram post. This is a permanent backend filter: every future sync marks non-selected Telegram-page deals as `rejected`, and `GET /api/deals` only serves active deals.

For Vercel, set the same environment variables in the Vercel project settings:

```bash
GENIE_LOOT_PAGE_URLS=https://t.me/s/India_loot_deals,https://t.me/s/king_deal_1,https://t.me/s/icoolzTricks
GENIE_LOOT_BEST_DEAL_FRACTION=0.3
GENIE_LOOT_CHEAP_PRICE_LIMIT=999
GENIE_LOOT_REJECT_UNSELECTED=true
GENIE_LOOT_STALE_SCAN_LIMIT=5000
```

Telegram scraped deals are not given a fake expiry window. API responses include `fetchedAt`, `lastCheckedAt`, `sourceUpdatedAt`, and `platformExpiresAt` when the original platform/source provides a real expiry. Deals remain visible until the backend marks them expired, unavailable, invalid, or their real `platformExpiresAt` has passed.

After the Telegram posts are imported, resolve their product links and pull merchant details, images, and structured prices where the product site exposes them:

```text
http://127.0.0.1:5000/api/admin/enrich-genie-loot?limit=1000&concurrency=5
```

For a browser-fast all-entry run, start the scrape/enrichment as a background job:

```text
http://127.0.0.1:5000/api/admin/sync-genie-loot?fast=1&quick=1&maxPages=100&limit=1000&concurrency=20&timeoutMs=2000
```

To override the channel list in one request, pass comma-separated public preview URLs:

```text
http://127.0.0.1:5000/api/admin/sync-genie-loot?fast=1&quick=1&urls=https://t.me/s/India_loot_deals,https://t.me/s/king_deal_1,https://t.me/s/icoolzTricks&maxPages=100&limit=1000&concurrency=20&timeoutMs=2000
```

The response includes a `statusUrl` that can be opened to see whether the job is still running or complete.

Use `url=https://t.me/s/channel_name` to target another public Telegram channel preview. Private `https://t.me/+...` invite links still cannot expose old post history.

To scrape all configured deal channels and enrich actual product images in one backend job, use:

```text
http://127.0.0.1:5000/api/admin/scrape-all-deals?fast=1&quick=1&maxPages=100&limit=1500&concurrency=20&timeoutMs=2000
```

Use `blocking=true` only when you want the request to wait until scraping and enrichment are complete. Public app APIs still show only active valid deals updated in the last 24 hours. Android does not scrape directly; it reads cleaned backend/Supabase data.

Image behavior:

- Telegram preview-page images are saved as source images when present.
- Product pages are fetched server-side to extract JSON-LD image, `og:image`, `twitter:image`, and platform-specific images where available.
- `image_url` stays blank when no valid real image exists; Android then shows its neutral placeholder.
- Generic/category images are not written as product images.

### Edge Function Secrets

Set these in Supabase, not in Android:

```bash
supabase secrets set IMPORT_DEALS_CRON_SECRET=use_a_long_random_value
supabase secrets set TELEGRAM_BOT_TOKEN=your_new_bot_token
```

Source API keys can be added later using the secret names already stored in `deal_sources`:

```bash
supabase secrets set AMAZON_PARTNER_API_KEY=your_key
supabase secrets set FLIPKART_AFFILIATE_API_KEY=your_key
supabase secrets set MYNTRA_AFFILIATE_API_KEY=your_key
supabase secrets set AJIO_AFFILIATE_API_KEY=your_key
supabase secrets set CROMA_AFFILIATE_API_KEY=your_key
supabase secrets set TATACLIQ_AFFILIATE_API_KEY=your_key
```

For blocked HTML sources such as Flipkart/Croma, configure a server-side scraping proxy service later:

```bash
supabase secrets set SCRAPER_FETCH_PROXY_URL="https://your-scraper.example.com/fetch?url={url}"
supabase secrets set SCRAPER_FETCH_PROXY_TOKEN="your_proxy_token"
```

The proxy secret stays in Supabase only. Android never receives scraper/proxy credentials.

### Deploy And Schedule

Deploy the function from the project root:

```bash
supabase functions deploy import-deals
```

Then open `supabase/schedule-import-deals.sql`, replace the placeholders, and run it in the Supabase SQL editor.

Manual test:

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/import-deals" \
  -H "Authorization: Bearer YOUR_FUNCTION_BEARER_TOKEN" \
  -H "x-import-secret: YOUR_IMPORT_DEALS_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"force\":true}"
```

## Health Check

```bash
curl http://localhost:5000/api/health/supabase
```

If Supabase tables are missing, the API returns:

```json
{
  "success": false,
  "message": "Table not found. Please create Supabase tables first.",
  "code": "TABLE_NOT_FOUND"
}
```

## WhatsApp OTP Setup

WhatsApp login uses the backend OTP endpoints. Android sends the mobile number to `POST /api/auth/whatsapp/request-otp`, then verifies the code with `POST /api/auth/whatsapp/verify-otp`. MyOperator credentials stay on the backend only and are never included in the Android build.

Set these values in the backend environment:

```bash
APP_ENV=development
MYOPERATOR_BASE_URL=https://publicapi.myoperator.co
MYOPERATOR_SEND_PATH=/chat/messages
MYOPERATOR_API_TOKEN=your_myoperator_whatsapp_auth_token_here
MYOPERATOR_COMPANY_ID=your_myoperator_company_id_here
MYOPERATOR_PHONE_NUMBER_ID=your_myoperator_phone_number_id_here
MYOPERATOR_WHATSAPP_TEMPLATE_NAME=otp_verify
MYOPERATOR_WHATSAPP_TEMPLATE_LANGUAGE=en
SAMPLE_LOGIN_MOBILE=9699353648
SAMPLE_LOGIN_OTP=123456
FIXED_LOGIN_MOBILE=9699353648
FIXED_LOGIN_OTP=123456
WHATSAPP_OTP_SECRET=change_this_to_a_long_random_value
WHATSAPP_OTP_PASSWORD_SECRET=change_this_to_a_different_long_random_value
```

For local testing without sending real WhatsApp messages, set `APP_ENV=development`. In development only, OTP `123456` is accepted by the backend for valid Indian mobile numbers. In non-development environments, OTPs must come from MyOperator.

For local testing, [supabase/seed.sql](supabase/seed.sql) adds mobile `9699353648` with OTP `123456` to `sample_whatsapp_otp_logins`. The backend reads that table through the normal WhatsApp OTP endpoints, with the `FIXED_LOGIN_*` env values as a fallback before the seed is applied.

## Android Notes

The Android app is Kotlin-based and calls this backend for authentication and deal data.

- Keep Supabase service credentials out of Android.
- The default Android backend URL is `https://enjoyfreedeals.vercel.app`.
- For local backend testing, override the backend URL at build time. Use `http://10.0.2.2:5000` for the Android emulator or your PC Wi-Fi/LAN IP for a physical phone:

```bash
./gradlew assembleDebug -PBACKEND_BASE_URL=http://10.0.2.2:5000
```

- Auth endpoints return a Supabase access token to Android. Android stores only the user session values, never the Supabase service-role key.

## Web App Notes

The React/Vite web app from `grab-savvy-central` is merged under `web/`.

- Web deal and category pages call the same Vercel backend as Android through `VITE_API_BASE_URL`.
- Default web API URL is `https://enjoyfreedeals.vercel.app`.
- Use the same Supabase project as the backend. Frontend may use only the public anon key for auth/public reads.
- Keep `SUPABASE_SERVICE_ROLE_KEY` only in Vercel backend environment variables.
- To deploy the web app separately on Vercel, set the project root directory to `web` and configure:

```bash
VITE_API_BASE_URL=https://enjoyfreedeals.vercel.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Backend deployment stays at the repository root so `/api/*` routes continue to use `api/index.js`, `src/`, and the shared root `supabase/` migrations/schema.
