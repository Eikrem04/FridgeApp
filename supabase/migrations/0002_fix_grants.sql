-- Fixes "permission denied for table ..." (Postgres error 42501) surfacing in the app as
-- "Couldn't load your kitchen" / "Failed to load your data." right after signing in.
--
-- Cause: this project was created with "Automatically expose new tables" disabled. That
-- setting controls whether Supabase applies its default privilege grants (SELECT, INSERT,
-- UPDATE, DELETE on public schema tables) to the `authenticated` role whenever a new table
-- is created. With it off, 0001_init.sql's `create table` statements created tables with
-- Row Level Security enabled and correct policies, but the `authenticated` role was never
-- actually granted permission to touch them at all — and Postgres checks table-level GRANTs
-- before it ever evaluates a row-level security policy. No RLS policy can "let you in" if
-- the role has no grant on the table in the first place, which is exactly what was happening.
--
-- This migration only grants privileges to `authenticated` (never `anon`), and only for the
-- exact operations the app performs. It does not touch, weaken, or replace any RLS policy —
-- every row is still filtered by `auth.uid() = user_id` from 0001_init.sql. A user with these
-- grants but without a matching RLS policy still can't see or change anyone else's rows.

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.storage_units to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.inventory_items to authenticated;
grant select, insert, update, delete on public.shopping_list_items to authenticated;
grant select, insert, update, delete on public.stat_events to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

-- Because "Automatically expose new tables" is off for this project, Supabase will not grant
-- privileges to `authenticated` on any table you create going forward, either — you'd hit this
-- exact bug again on the next migration. This makes any table created from now on (by this
-- Postgres role, in this schema) grant `authenticated` the same four privileges automatically,
-- without granting anything to `anon` and without touching RLS.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
