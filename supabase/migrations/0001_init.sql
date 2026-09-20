-- Kitchen app schema: storage units, categories, inventory items, shopping list,
-- stat events, and per-user settings. Every table is scoped to auth.uid() via RLS
-- so a user can only ever see or modify their own rows.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- storage_units
-- ---------------------------------------------------------------------------
create table if not exists public.storage_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('fridge', 'freezer')),
  created_at timestamptz not null default now()
);

create index if not exists storage_units_user_id_idx on public.storage_units (user_id);

alter table public.storage_units enable row level security;

drop policy if exists "storage_units_owner" on public.storage_units;
create policy "storage_units_owner" on public.storage_units
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default 'Package',
  is_custom boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

drop policy if exists "categories_owner" on public.categories;
create policy "categories_owner" on public.categories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- inventory_items
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_id uuid not null references public.storage_units (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default 'pcs',
  expiration_date date,
  notes text,
  image_url text,
  date_added timestamptz not null default now(),
  is_favorite boolean not null default false
);

create index if not exists inventory_items_user_id_idx on public.inventory_items (user_id);
create index if not exists inventory_items_storage_id_idx on public.inventory_items (storage_id);

alter table public.inventory_items enable row level security;

drop policy if exists "inventory_items_owner" on public.inventory_items;
create policy "inventory_items_owner" on public.inventory_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- shopping_list_items
-- ---------------------------------------------------------------------------
create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  category_id uuid references public.categories (id) on delete set null,
  purchased boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shopping_list_items_user_id_idx on public.shopping_list_items (user_id);

alter table public.shopping_list_items enable row level security;

drop policy if exists "shopping_list_items_owner" on public.shopping_list_items;
create policy "shopping_list_items_owner" on public.shopping_list_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- stat_events
-- ---------------------------------------------------------------------------
create table if not exists public.stat_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('added', 'consumed', 'expired', 'discarded')),
  item_name text not null,
  category_id uuid references public.categories (id) on delete set null,
  quantity numeric not null default 0,
  occurred_at timestamptz not null default now()
);

create index if not exists stat_events_user_id_idx on public.stat_events (user_id);

alter table public.stat_events enable row level security;

drop policy if exists "stat_events_owner" on public.stat_events;
create policy "stat_events_owner" on public.stat_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_settings (one row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  onboarding_complete boolean not null default false,
  user_name text,
  notifications_enabled boolean not null default true,
  notifications_timing text not null default '1' check (notifications_timing in ('0', '1', '2', '3', 'never')),
  expiring_soon_days integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_owner" on public.user_settings;
create policy "user_settings_owner" on public.user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- New user bootstrap: default settings row + starter categories
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.categories (user_id, name, icon, is_custom)
  values
    (new.id, 'Dairy', 'Milk', false),
    (new.id, 'Meat', 'Beef', false),
    (new.id, 'Fish', 'Fish', false),
    (new.id, 'Vegetables', 'Carrot', false),
    (new.id, 'Fruit', 'Apple', false),
    (new.id, 'Bread', 'Wheat', false),
    (new.id, 'Drinks', 'CupSoda', false),
    (new.id, 'Frozen', 'Snowflake', false),
    (new.id, 'Ready meals', 'UtensilsCrossed', false),
    (new.id, 'Sauces', 'Droplet', false),
    (new.id, 'Snacks', 'Cookie', false),
    (new.id, 'Breakfast', 'Egg', false),
    (new.id, 'Other', 'Package', false);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Realtime: broadcast changes on these tables so other signed-in devices
-- for the same account update live.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'storage_units'
  ) then
    alter publication supabase_realtime add table public.storage_units;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inventory_items'
  ) then
    alter publication supabase_realtime add table public.inventory_items;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shopping_list_items'
  ) then
    alter publication supabase_realtime add table public.shopping_list_items;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stat_events'
  ) then
    alter publication supabase_realtime add table public.stat_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_settings'
  ) then
    alter publication supabase_realtime add table public.user_settings;
  end if;
end $$;
