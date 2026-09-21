-- Optional cache so Kitchen can remember a scanned product after the first
-- successful Open Food Facts lookup, instead of depending on the network
-- every time the same barcode is scanned again.
--
-- This migration is NOT required for barcode scanning, product lookup, or
-- manual item entry to work — the app already degrades gracefully (falls
-- straight through to a live Open Food Facts lookup, or manual entry) if
-- this table doesn't exist. Run this only if you want the "remembers
-- products you've already scanned" behavior, and it's safe to run at any
-- time — nothing else in the app depends on it.

create table if not exists public.known_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  barcode text not null,
  name text not null,
  brand text,
  category_id uuid references public.categories (id) on delete set null,
  unit text,
  image_url text,
  source text not null default 'openfoodfacts',
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, barcode)
);

create index if not exists known_products_user_id_idx on public.known_products (user_id);

alter table public.known_products enable row level security;

drop policy if exists "known_products_owner" on public.known_products;
create policy "known_products_owner" on public.known_products
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Same grants-vs-RLS distinction as 0002_fix_grants.sql: RLS alone doesn't
-- expose a table through the Data API if "Automatically expose new tables"
-- is off in your project — the role also needs an explicit GRANT.
grant select, insert, update, delete on public.known_products to authenticated;

-- Realtime, so a product looked up on one signed-in device is instantly
-- known on another (consistent with every other table in this app).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'known_products'
  ) then
    alter publication supabase_realtime add table public.known_products;
  end if;
end $$;
