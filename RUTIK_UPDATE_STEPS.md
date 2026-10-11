# Update Rutik Branch With Viraj Changes

Run these commands from the project folder.

```bash
cd "D:\Git Practice\EnjoyFreeDeals"
git fetch origin
git checkout Rutik
git pull origin Rutik
git merge origin/Viraj
```

If Git shows conflicts, resolve them in Android Studio, then run:

```bash
git add .
git commit -m "Merge Viraj Supabase backend updates"
```

Set up backend environment:

```bash
copy .env.example .env
```

Open `.env` and add the real Supabase values:

```env
SUPABASE_URL=https://pzgyphnerjatlqlvvvsl.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_ID=pzgyphnerjatlqlvvvsl
PORT=5000
```

Install and run backend:

```bash
npm install
npm run dev
```

Verify backend:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/supabase
```

Run Android app:

```bash
.\gradlew.bat installDebug
```

Push updated Rutik branch:

```bash
git push origin Rutik
```

Important:

- Do not commit `.env`.
- Do not commit `.mcp.json`.
- Do not put `SUPABASE_SERVICE_ROLE_KEY` in Android.
- Android should call backend at `http://10.0.2.2:5000` on emulator.

## Admin Panel Access & Missing Tables Setup

- **Admin Login Secret Key**: `enjoyfreedeals_admin_secret`
- **Admin Panel URL**: `http://localhost:8080/admin` (or `/admin/database`)
- **Missing Tables SQL Migration**: [`supabase/migrations/20261011_create_all_missing_admin_tables.sql`](file:///d:/freedeals1/supabase/migrations/20261011_create_all_missing_admin_tables.sql)
- **Supabase SQL Editor**: [https://supabase.com/dashboard/project/pzgyphnerjatlqlvvvsl/sql/new](https://supabase.com/dashboard/project/pzgyphnerjatlqlvvvsl/sql/new)
