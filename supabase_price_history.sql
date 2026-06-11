create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references deals(id) on delete cascade,
  deal_id uuid references deals(id) on delete cascade,
  platform text,
  price numeric not null,
  original_price numeric,
  recorded_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_price_history_product_id on price_history(product_id);
create index if not exists idx_price_history_deal_id on price_history(deal_id);
create index if not exists idx_price_history_recorded_at on price_history(recorded_at);
create index if not exists idx_price_history_price on price_history(price);
