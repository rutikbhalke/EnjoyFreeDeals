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
- Profiles: `profiles`
- Notifications: `notifications`
- Admin roles: `user_roles`
- Scraper support: `scraper_jobs`, `deal_sources`, `scraped_deal_items`

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

## Android Notes

The Android app is Kotlin-based and calls this backend for email/password auth.

- Keep Supabase service credentials out of Android.
- The default Android backend URL is `http://10.0.2.2:5000`, which works for the Android emulator when the backend runs on your machine.
- For a physical device, start the backend on your computer and build with your LAN URL:

```bash
./gradlew assembleDebug -PBACKEND_BASE_URL=http://YOUR_LAN_IP:5000
```

- Auth endpoints return a Supabase access token to Android. Android stores only the user session values, never the Supabase service-role key.
