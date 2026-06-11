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
curl https://YOUR-VERCEL-DOMAIN.vercel.app/api/health
curl https://YOUR-VERCEL-DOMAIN.vercel.app/api/deals?limit=10
```

Use the Vercel URL in Android `local.properties`:

```properties
BACKEND_BASE_URL=https://freedeals1.vercel.app
```

Do not use `http://192.168.1.3:5000` for installed APKs. That address only works on the same local Wi-Fi while the backend is running on the development PC.

Vercel functions are serverless. For long Telegram scraping jobs, prefer the VPS sync below so the job is not stopped when a serverless function ends.

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
