# EnjoyFreeDeals Deployment

## Vercel API

The Vercel entrypoint is `api/index.js`, which loads the same Express app as the local/VPS server. Set these environment variables in Vercel Project Settings before deploying:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_ID=
APP_ENV=production
IMPORT_DEALS_CRON_SECRET=
TELEGRAM_IMPORT_SECRET=
GENIE_LOOT_PAGE_URLS=https://t.me/s/India_loot_deals,https://t.me/s/king_deal_1,https://t.me/s/icoolzTricks
GENIE_LOOT_BEST_DEAL_FRACTION=0.3
GENIE_LOOT_CHEAP_PRICE_LIMIT=999
GENIE_LOOT_REJECT_UNSELECTED=true
GENIE_LOOT_STALE_SCAN_LIMIT=5000
MYOPERATOR_API_TOKEN=
MYOPERATOR_COMPANY_ID=
MYOPERATOR_PHONE_NUMBER_ID=
MYOPERATOR_WHATSAPP_TEMPLATE_NAME=otp_verify
```

Deploy:

```bash
npm run check:deploy
npm run vercel:deploy
```

After deployment, test:

```bash
curl https://enjoyfreedeals-web.vercel.app/api/health
curl https://enjoyfreedeals-web.vercel.app/api/deals?limit=10
```

Use the active Vercel URL in Android `local.properties`:

```properties
BACKEND_BASE_URL=https://enjoyfreedeals-web.vercel.app
```

> **Note on Vercel Environment Variables**: Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are populated with non-empty values in the Vercel Project Settings for `enjoyfreedeals-web` so that `/api/*` endpoints pass environment validation.

Do not use `http://192.168.1.3:5000` for installed APKs. That address only works on the same local Wi-Fi while the backend is running on the development PC.

Vercel functions are serverless. For long Telegram scraping jobs, prefer the VPS sync or GitHub Actions workflow (`.github/workflows/telegram-sync.yml`) so the job is not stopped when a serverless function ends.

## VPS API With PM2

On Ubuntu/Debian VPS:

```bash
sudo apt update
sudo apt install -y git nodejs npm nginx
sudo npm install -g pm2
git clone YOUR_REPO_URL freedeals1
cd freedeals1
npm install --omit=dev
cp .env.example .env
nano .env
npm run check:deploy
npm run pm2:start
pm2 save
pm2 startup
```

Nginx reverse proxy:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_SERVER_IP;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Price Tracking & Drop Alerts

The platform includes real-time product price tracking across Amazon, Flipkart, Myntra, Ajio, and more, as well as periodic background price synchronization and user price drop alerts.

### GitHub Actions Workflows

1. **CI - Test & Build** (`.github/workflows/ci.yml`):
   - Runs syntax checks (`npm run check:deploy`), backend node tests (`npm test`), web tests (`npm --prefix web run test`), and builds the web application.
2. **Vercel Deploy & Health Check** (`.github/workflows/deploy.yml`):
   - Validates build readiness and verifies live API health.
3. **Sync Telegram Loot Deals** (`.github/workflows/telegram-sync.yml`):
   - Scrapes connected Telegram channels every 6 hours and enriches product details.
4. **Sync Price Tracking & Drop Alerts** (`.github/workflows/price-tracking.yml`):
   - Scheduled job running every 6 hours (`30 */6 * * *`) that checks current live prices for all tracked products, updates `price_history`, and fires alerts/notifications when prices drop below user targets.

Run manual price tracking sync:

```bash
npm run sync:price-tracking
```

### Database Tables & Migrations

Price tracking uses the following Supabase tables:
- `deals`: Stores all deals and tracked products (`source: "PRICE_TRACKED"`).
- `price_history`: Records historical price checks for trend graphs.
- `tracked_products`: Holds normalized URLs, lowest/highest prices, and refresh times.
- `price_alerts`: User price targets, triggered flags, and timestamps.
- `notifications`: User alert notifications when prices drop below targets.

If `price_alerts` or `tracked_products` are missing in a fresh Supabase instance, execute `supabase/migrations/20260605_user_deal_actions_profile.sql` and `supabase/migrations/20260613_web_price_tracking.sql` in the Supabase SQL Editor.

## Permanent Deal Filtering

Run this on the VPS to scrape and permanently reject weak/stale Telegram deals:

```bash
npm run sync:genie-loot
```

Schedule every 30 minutes:

```bash
crontab -e
*/30 * * * * cd /path/to/freedeals1 && /usr/bin/npm run sync:genie-loot >> sync-genie-loot.log 2>&1
```

The filter is durable because selected deals stay `active`, while non-selected and stale Telegram-page deals are updated to `rejected` in Supabase.

## SEO Deployment

The SEO implementation is integrated into the existing Vite React app. It uses
`react-helmet-async` through `web/src/components/SEO.tsx`; a Next.js `_app.tsx`
or duplicate `components/SEOHead.tsx` file is not required.

Implemented assets:

- Organization, WebSite, SearchAction, and page-level JSON-LD
- Canonical, Open Graph, and Twitter metadata
- Self-hosted `web/public/og-image.png` (1200 x 630)
- `web/public/robots.txt`
- `web/public/llms.txt`
- `web/public/sitemap.xml`

The homepage passes Organization and WebSite schema to the shared component:

```tsx
<SEO
  canonical={SITE_URL}
  jsonLd={[websiteJsonLd, orgJsonLd, faqJsonLd]}
/>
```

The SearchAction uses the application's working route:

```text
https://enjoyfreedeals.com/deals?q={search_term_string}
```

Build and deploy:

```powershell
npm --prefix web run build
npm run build
git add DEPLOYMENT.md
git commit -m "Document SEO deployment"
git push origin main
```

After Vercel finishes:

1. Open `https://enjoyfreedeals.com/robots.txt`.
2. Open `https://enjoyfreedeals.com/llms.txt`.
3. Open `https://enjoyfreedeals.com/sitemap.xml`.
4. Open `https://enjoyfreedeals.com/og-image.png`.
5. Validate the homepage with the [Google Rich Results Test](https://search.google.com/test/rich-results).
6. Confirm Organization and WebSite JSON-LD in the rendered page source.

These changes address structured data, crawl directives, AI crawler guidance,
sitemap discovery, and stable social sharing. The supplied guide's 38-to-48
score is a target, not a guaranteed universal score; the result depends on the
auditing tool and run date.
