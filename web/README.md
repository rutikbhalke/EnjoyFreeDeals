# EnjoyFreeDeals Web

React/Vite web app merged from `grab-savvy-central`.

## Runtime Flow

Web app -> Vercel backend API -> shared Supabase database

The web app should not use a Supabase service-role key. Sensitive/admin operations must be handled by backend API routes.

## Environment

Create `web/.env` from `web/.env.example`:

```bash
VITE_API_BASE_URL=https://enjoyfreedeals.vercel.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Commands

```bash
npm install
npm run build
```

For Vercel web deployment, set the project root directory to `web`.
