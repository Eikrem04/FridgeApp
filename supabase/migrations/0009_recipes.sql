-- Kitch's own curated recipe catalog, replacing the TheMealDB integration.
--
-- Unlike every other table in this app, recipes are global content, not
-- per-user data: no user_id, no ownership RLS, no Realtime subscription
-- (curated content doesn't change while a user has the app open). Every
-- authenticated user can read every row; nothing in the client ever writes
-- to this table.
--
-- Bilingual by design: title/instructions are duplicated per language
-- (_en/_nb) rather than stored as a jsonb blob, so a simple column read
-- picks the right one with no parsing. Ingredients need one extra layer —
-- each ingredient carries a stable `canonical_name` (always English) used
-- for inventory/avoided-ingredient matching, alongside localized display
-- names, since matching logic (see recipeIngredients.ts) must never care
-- which language the UI happens to be showing.
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_nb text not null,
  -- One or more of 'breakfast' | 'lunch' | 'dinner' — authored directly, not inferred, so it's
  -- always accurate (unlike TheMealDB's category-guessing this replaces).
  meal_type text[] not null,
  category text,
  is_vegetarian boolean not null default false,
  -- RecipeIngredient[]-shaped: [{ "canonical_name", "name_en", "name_nb", "measure_en"?, "measure_nb"? }, ...]
  ingredients jsonb not null,
  instructions_en text,
  instructions_nb text,
  source_url text,
  created_at timestamptz not null default now(),
  constraint recipes_meal_type_valid check (meal_type <@ array['breakfast', 'lunch', 'dinner']::text[]),
  constraint recipes_meal_type_nonempty check (array_length(meal_type, 1) > 0)
);

alter table public.recipes enable row level security;

drop policy if exists "recipes_read_all" on public.recipes;
create policy "recipes_read_all" on public.recipes
  for select
  using (true);

-- Read-only from the client — no insert/update/delete grant, matching the "never writable from
-- the client" requirement. Content is managed solely via migrations/the Supabase SQL editor.
grant select on public.recipes to authenticated;

-- ---------------------------------------------------------------------------
-- Initial test seed: 6 recipes (2 breakfast, 2 lunch, 2 dinner). Nordic
-- everyday food plus common international meals, per the product goals.
-- Expand this to the full 60-80 curated set in a follow-up migration/seed.
-- ---------------------------------------------------------------------------
insert into public.recipes (slug, title_en, title_nb, meal_type, category, is_vegetarian, ingredients, instructions_en, instructions_nb)
values
  (
    'oatmeal-porridge',
    'Oatmeal Porridge', 'Havregrøt',
    array['breakfast'], 'Norwegian', false,
    '[
      {"canonical_name": "oats", "name_en": "Oats", "name_nb": "Havregryn", "measure_en": "3 dl", "measure_nb": "3 dl"},
      {"canonical_name": "milk", "name_en": "Milk", "name_nb": "Melk", "measure_en": "6 dl", "measure_nb": "6 dl"},
      {"canonical_name": "salt", "name_en": "Salt", "name_nb": "Salt", "measure_en": "1 tsp", "measure_nb": "1 ts"},
      {"canonical_name": "sugar", "name_en": "Sugar", "name_nb": "Sukker", "measure_en": "to taste", "measure_nb": "etter smak"}
    ]'::jsonb,
    'Bring the milk to a boil. Stir in the oats and salt, then simmer on low heat for 5-8 minutes, stirring occasionally. Serve with a sprinkle of sugar.',
    'Kok opp melken. Rør inn havregryn og salt, og la det small-koke på lav varme i 5-8 minutter mens du rører innimellom. Server med litt sukker på toppen.'
  ),
  (
    'scrambled-eggs-bacon',
    'Scrambled Eggs with Bacon', 'Eggerøre med bacon',
    array['breakfast'], 'Breakfast', false,
    '[
      {"canonical_name": "eggs", "name_en": "Eggs", "name_nb": "Egg", "measure_en": "4", "measure_nb": "4"},
      {"canonical_name": "bacon", "name_en": "Bacon", "name_nb": "Bacon", "measure_en": "100 g", "measure_nb": "100 g"},
      {"canonical_name": "butter", "name_en": "Butter", "name_nb": "Smør", "measure_en": "1 tbsp", "measure_nb": "1 ss"},
      {"canonical_name": "chives", "name_en": "Chives", "name_nb": "Gressløk", "measure_en": "to taste", "measure_nb": "etter smak"}
    ]'::jsonb,
    'Fry the bacon until crisp and set aside. Whisk the eggs, melt the butter in the same pan, and scramble the eggs over low heat. Serve topped with the bacon and chives.',
    'Stek baconet sprøtt og sett til side. Visp sammen eggene, smelt smøret i samme panne, og rør eggene til eggerøre på lav varme. Server med baconet og gressløk på toppen.'
  ),
  (
    'ham-cheese-sandwich',
    'Ham and Cheese Sandwich', 'Brødskive med skinke og ost',
    array['lunch'], 'Norwegian', false,
    '[
      {"canonical_name": "bread", "name_en": "Bread", "name_nb": "Brød", "measure_en": "2 slices", "measure_nb": "2 skiver"},
      {"canonical_name": "ham", "name_en": "Ham", "name_nb": "Skinke", "measure_en": "2 slices", "measure_nb": "2 skiver"},
      {"canonical_name": "cheese", "name_en": "Cheese", "name_nb": "Ost", "measure_en": "2 slices", "measure_nb": "2 skiver"},
      {"canonical_name": "butter", "name_en": "Butter", "name_nb": "Smør", "measure_en": "to taste", "measure_nb": "etter smak"}
    ]'::jsonb,
    'Butter the bread, then top with ham and cheese.',
    'Smør brødskivene, og legg på skinke og ost.'
  ),
  (
    'taco',
    'Taco', 'Taco',
    array['lunch'], 'Mexican', false,
    '[
      {"canonical_name": "ground beef", "name_en": "Ground beef", "name_nb": "Kjøttdeig", "measure_en": "400 g", "measure_nb": "400 g"},
      {"canonical_name": "taco shells", "name_en": "Taco shells", "name_nb": "Tacoskjell", "measure_en": "8", "measure_nb": "8"},
      {"canonical_name": "tomato", "name_en": "Tomato", "name_nb": "Tomat", "measure_en": "2", "measure_nb": "2"},
      {"canonical_name": "lettuce", "name_en": "Lettuce", "name_nb": "Issalat", "measure_en": "1/2 head", "measure_nb": "1/2 hode"},
      {"canonical_name": "cheese", "name_en": "Cheese", "name_nb": "Ost", "measure_en": "100 g", "measure_nb": "100 g"},
      {"canonical_name": "onion", "name_en": "Onion", "name_nb": "Løk", "measure_en": "1", "measure_nb": "1"},
      {"canonical_name": "taco seasoning", "name_en": "Taco seasoning", "name_nb": "Tacokrydder", "measure_en": "1 packet", "measure_nb": "1 pose"}
    ]'::jsonb,
    'Brown the ground beef, add the taco seasoning and a splash of water, and simmer for a few minutes. Chop the tomato, lettuce, and onion. Warm the taco shells and fill with beef, vegetables, and cheese.',
    'Brun kjøttdeigen, tilsett tacokrydder og litt vann, og la det småkoke noen minutter. Grovhakk tomat, issalat og løk. Varm tacoskjellene og fyll med kjøttdeig, grønnsaker og ost.'
  ),
  (
    'fish-cakes-mashed-potatoes',
    'Fish Cakes with Mashed Potatoes', 'Fiskekaker med potetmos',
    array['dinner'], 'Norwegian', false,
    '[
      {"canonical_name": "fish cakes", "name_en": "Fish cakes", "name_nb": "Fiskekaker", "measure_en": "8", "measure_nb": "8"},
      {"canonical_name": "potato", "name_en": "Potato", "name_nb": "Potet", "measure_en": "800 g", "measure_nb": "800 g"},
      {"canonical_name": "milk", "name_en": "Milk", "name_nb": "Melk", "measure_en": "2 dl", "measure_nb": "2 dl"},
      {"canonical_name": "butter", "name_en": "Butter", "name_nb": "Smør", "measure_en": "50 g", "measure_nb": "50 g"},
      {"canonical_name": "peas", "name_en": "Peas", "name_nb": "Erter", "measure_en": "200 g", "measure_nb": "200 g"}
    ]'::jsonb,
    'Boil the potatoes until tender, then mash with milk and butter. Fry the fish cakes until golden on both sides. Boil the peas briefly. Serve together.',
    'Kok potetene møre, og mos dem med melk og smør. Stek fiskekakene gylne på begge sider. Kok ertene kort. Server sammen.'
  ),
  (
    'chicken-wok-noodles',
    'Chicken Wok with Noodles', 'Kylling wok med nudler',
    array['dinner'], 'Asian', false,
    '[
      {"canonical_name": "chicken breast", "name_en": "Chicken breast", "name_nb": "Kyllingfilet", "measure_en": "400 g", "measure_nb": "400 g"},
      {"canonical_name": "noodles", "name_en": "Noodles", "name_nb": "Nudler", "measure_en": "250 g", "measure_nb": "250 g"},
      {"canonical_name": "bell pepper", "name_en": "Bell pepper", "name_nb": "Paprika", "measure_en": "2", "measure_nb": "2"},
      {"canonical_name": "broccoli", "name_en": "Broccoli", "name_nb": "Brokkoli", "measure_en": "200 g", "measure_nb": "200 g"},
      {"canonical_name": "soy sauce", "name_en": "Soy sauce", "name_nb": "Soyasaus", "measure_en": "3 tbsp", "measure_nb": "3 ss"},
      {"canonical_name": "garlic", "name_en": "Garlic", "name_nb": "Hvitløk", "measure_en": "2 cloves", "measure_nb": "2 fedd"},
      {"canonical_name": "ginger", "name_en": "Ginger", "name_nb": "Ingefær", "measure_en": "1 tbsp", "measure_nb": "1 ss"}
    ]'::jsonb,
    'Cook the noodles per package instructions. Slice the chicken and stir-fry in a hot wok with garlic and ginger until cooked through. Add the pepper and broccoli and stir-fry a few more minutes. Add the noodles and soy sauce, and toss to combine.',
    'Kok nudlene etter anvisning på pakken. Skjær kyllingen i strimler og wok den sammen med hvitløk og ingefær til den er gjennomstekt. Ha i paprika og brokkoli, og wok noen minutter til. Ha i nudler og soyasaus, og vend godt sammen.'
  )
on conflict (slug) do nothing;
