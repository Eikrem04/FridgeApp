-- Adds `avoidedIngredients` to the recipe-preferences profile (allergy/
-- avoided-ingredient filtering in Recipes). Since recipe_preferences is a
-- jsonb blob, no new column is required — the app already defaults any
-- missing sub-field safely on read (see settingsFromRow in
-- src/lib/mappers.ts), so this migration is optional but kept small and
-- additive for two reasons:
--   1. Updates the column's own default so brand-new rows already include
--      the key, matching the app-level default going forward.
--   2. Backfills the key onto existing rows that predate this field, purely
--      additively (jsonb `||` only ADDS the missing key — it never touches
--      or overwrites any existing preference value, including any other
--      avoidedIngredients a row might already have).
--
-- Existing users keep working before and after this runs either way.

alter table public.user_settings
  alter column recipe_preferences set default '{
    "mealInterests": ["dinner"],
    "cookingTime": "any",
    "inventoryImportance": "balanced",
    "dietary": "none",
    "avoidedIngredients": [],
    "setupSeen": false
  }'::jsonb;

update public.user_settings
set recipe_preferences = recipe_preferences || '{"avoidedIngredients": []}'::jsonb
where not (recipe_preferences ? 'avoidedIngredients');
