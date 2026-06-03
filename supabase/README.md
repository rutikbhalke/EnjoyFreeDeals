# EnjoyFreeDeals Supabase SQL Setup

Use these scripts in the Supabase Dashboard for project `pzgyphnerjatlqlvvvsl`.

## Steps

1. Open the Supabase Dashboard.
2. Select the EnjoyFreeDeals project.
3. Go to **SQL Editor**.
4. Open `supabase/schema.sql`, copy its contents, and run it first.
5. Open `supabase/seed.sql`, copy its contents, and run it second.
6. Open the Android app and refresh or reopen the **All Deals** screen.

## Files

- `schema.sql` creates `public.deals`, enables Row Level Security, and allows anon users to read only active deals.
- `seed.sql` inserts or updates sample active deals without creating duplicate titles.

No service role key is required for these dashboard SQL steps.
