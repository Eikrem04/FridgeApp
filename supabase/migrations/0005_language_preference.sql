-- Adds a per-user language preference for the new bilingual (English /
-- Norwegian Bokmål) UI. 'system' means "resolve from the browser/device
-- locale at runtime" (see src/i18n/index.ts) — it is the safe default,
-- equivalent to today's behavior of always showing English, since a
-- non-Norwegian browser locale already resolves to English.
--
-- Purely additive: `default 'system'` backfills every existing row
-- automatically as part of adding the column, so existing users keep
-- working with no manual intervention and no separate backfill script.

alter table public.user_settings
  add column if not exists language text not null default 'system'
  check (language in ('system', 'en', 'nb'));
