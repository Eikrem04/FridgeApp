-- Adds "pantry" as a valid storage_units.type value, alongside the
-- existing "fridge" and "freezer". This is required for Pantry to become
-- a first-class default storage option (see OnboardingFlow.tsx and the
-- idempotent existing-account backfill in useStore.ts's
-- initializeForUser) — without it, any insert/update of a storage unit
-- with type = 'pantry' is rejected by the check constraint below.
--
-- Purely additive: no existing row is touched or re-validated against a
-- narrower rule, "fridge" and "freezer" remain valid exactly as before,
-- and nothing here changes RLS or grants.
--
-- The constraint name matches Postgres' default naming for the unnamed
-- inline `check (...)` on storage_units.type in 0001_init.sql
-- ("<table>_<column>_check").

alter table public.storage_units drop constraint if exists storage_units_type_check;
alter table public.storage_units add constraint storage_units_type_check
  check (type in ('fridge', 'freezer', 'pantry'));
