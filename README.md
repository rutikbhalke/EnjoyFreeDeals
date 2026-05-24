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

- `POST /api/auth/register`
  - Body: `name`, `email`, `mobile`, `password`
- `POST /api/auth/login`
  - Body: `email`, `password`
- `POST /api/auth/google`
  - Body: `idToken`; optional `accessToken`, `nonce`
- `POST /api/auth/password-reset`
  - Body: `email`
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

### Edge Function Secrets

Set these in Supabase, not in Android:

```bash
supabase secrets set IMPORT_DEALS_CRON_SECRET=use_a_long_random_value
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

## Google OAuth Setup

Google login uses the native Android ID-token flow. Android gets a Google ID token, sends it to `POST /api/auth/google`, and the backend exchanges it with Supabase Auth. Android never receives a Supabase service-role key or a Google client secret.

Manual setup required:

1. In Google Cloud, configure the OAuth consent screen.
2. Create a Web OAuth Client ID. This value is used as `GOOGLE_WEB_CLIENT_ID` in Android builds.
3. Create an Android OAuth client for package `com.example.freedeals1` with the debug/release SHA fingerprints.
4. In Supabase Dashboard, enable Auth Provider: Google, then add the Web Client ID and Web Client Secret.

Build Android with the Web Client ID:

```powershell
.\gradlew :app:assembleDebug -PGOOGLE_WEB_CLIENT_ID="your-web-client-id.apps.googleusercontent.com"
```

The Google Web Client ID is safe to include in Android. The Google Client Secret is not safe for Android and must stay in Google/Supabase provider configuration only.

## Android Notes

The Android app is Kotlin-based and calls this backend for email/password and Google auth.

- Keep Supabase service credentials out of Android.
- The default Android backend URL is `http://10.0.2.2:5000`, which works for the Android emulator when the backend runs on your machine.
- For a physical device, start the backend on your computer and build with your LAN URL:

```bash
./gradlew assembleDebug -PBACKEND_BASE_URL=http://YOUR_LAN_IP:5000
```

- Auth endpoints return a Supabase access token to Android. Android stores only the user session values, never the Supabase service-role key.
