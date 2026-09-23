-- Adds a small recipe-preferences profile used to personalize Recipe
-- suggestions: which meals the user usually cooks, how much to weigh
-- current inventory, dietary preference, household size, and a preferred
-- cooking-time bucket. Also carries `setupSeen`, so the one-time
-- preferences quiz shown from the Recipes page only ever prompts once
-- (completed or explicitly skipped) and never nags again.
--
-- Stored as a single jsonb blob rather than one column per field, since
-- it's a cohesive small profile that may grow a field or two later
-- without needing a new migration each time it changes.
--
-- Purely additive: `default` backfills every existing row automatically,
-- so existing users keep working with no manual intervention. `setupSeen`
-- defaults to false for every existing row too — intentional, since an
-- existing user has never explicitly configured these preferences either,
-- and the quiz is optional and skippable, never a blocking flow.

alter table public.user_settings
  add column if not exists recipe_preferences jsonb not null default '{
    "mealInterests": ["dinner"],
    "cookingTime": "any",
    "inventoryImportance": "balanced",
    "dietary": "none",
    "householdSize": "1",
    "setupSeen": false
  }'::jsonb;
