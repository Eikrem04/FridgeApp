import type { ApiRecipe, MealClass } from '../types/recipe'
import type { MealInterest } from '../types/recipePreferences'

/**
 * TheMealDB's recipe category taxonomy is a small, fixed set of 14 values
 * (verified live against categories.php) — not a huge, shifting ontology —
 * so a direct lookup table is reliable and easy to extend later.
 */
const CATEGORY_CLASS: Record<string, MealClass> = {
  beef: 'main',
  chicken: 'main',
  lamb: 'main',
  pork: 'main',
  goat: 'main',
  seafood: 'main',
  pasta: 'main',
  vegetarian: 'main',
  vegan: 'main',
  breakfast: 'breakfast',
  dessert: 'dessert',
  side: 'snack',
  starter: 'snack',
  miscellaneous: 'unknown',
}

/** Only consulted when the category itself doesn't resolve (e.g. "Miscellaneous"). Small and conservative on purpose. */
const DESSERT_TITLE_HINTS = [
  'cake', 'cookie', 'cookies', 'pudding', 'pie', 'brownie', 'tart', 'ice cream',
  'dessert', 'pancake', 'pancakes', 'waffle', 'waffles', 'muffin', 'muffins',
  'trifle', 'cheesecake', 'doughnut', 'donut', 'fudge', 'toffee',
]
const BREAKFAST_TITLE_HINTS = ['breakfast', 'omelette', 'omelet', 'porridge', 'granola']

/** Classifies a recipe into a small, explainable bucket from its category (primary signal) and title (fallback only). */
export const classifyRecipe = (recipe: Pick<ApiRecipe, 'category' | 'title'>): MealClass => {
  const categoryKey = recipe.category?.trim().toLowerCase()
  const fromCategory = categoryKey ? CATEGORY_CLASS[categoryKey] : undefined
  if (fromCategory && fromCategory !== 'unknown') return fromCategory

  const title = recipe.title.toLowerCase()
  if (DESSERT_TITLE_HINTS.some((hint) => title.includes(hint))) return 'dessert'
  if (BREAKFAST_TITLE_HINTS.some((hint) => title.includes(hint))) return 'breakfast'
  return 'unknown'
}

/** Which recipe classes satisfy each meal interest. "main" covers both dinner and lunch — TheMealDB has no lunch/dinner split. */
const MEAL_INTEREST_CLASSES: Record<MealInterest, MealClass[]> = {
  dinner: ['main'],
  lunch: ['main', 'snack'],
  breakfast: ['breakfast'],
  snacks: ['snack'],
  desserts: ['dessert'],
}

const INTEREST_LABEL_KEY: Record<MealInterest, string> = {
  dinner: 'match.goodDinnerMatch',
  lunch: 'match.goodLunchMatch',
  breakfast: 'match.goodBreakfastMatch',
  snacks: 'match.goodSnackMatch',
  desserts: 'match.goodDessertMatch',
}

/** Display priority when a class satisfies more than one selected interest (e.g. "main" fits both dinner and lunch). */
const INTEREST_PRIORITY: MealInterest[] = ['dinner', 'lunch', 'breakfast', 'desserts', 'snacks']

/**
 * Returns the translation key for a "Good X match" badge if this recipe's
 * class fits one of the user's selected meal interests, else null. Doubles
 * as the fit check used for ranking/filtering — a single source of truth
 * for "does this recipe's class satisfy what the user said they cook".
 */
export const preferenceFitLabelKey = (mealClass: MealClass, interests: MealInterest[]): string | null => {
  if (mealClass === 'unknown') return null
  const matchingInterests = interests.filter((interest) => MEAL_INTEREST_CLASSES[interest].includes(mealClass))
  if (matchingInterests.length === 0) return null
  const chosen = INTEREST_PRIORITY.find((interest) => matchingInterests.includes(interest)) ?? matchingInterests[0]
  return INTEREST_LABEL_KEY[chosen]
}

/** Categories that are definitively meat/fish — safe to exclude outright when the user wants vegetarian. */
const MEAT_CATEGORIES = new Set(['beef', 'chicken', 'lamb', 'pork', 'seafood', 'goat'])

/** Small, conservative keyword list — real recipe data (title + parsed ingredients), not a dietary ontology. */
const MEAT_KEYWORDS = [
  'chicken', 'beef', 'pork', 'bacon', 'ham', 'sausage', 'sausages', 'lamb', 'turkey',
  'duck', 'salmon', 'tuna', 'shrimp', 'prawn', 'prawns', 'fish', 'anchovy', 'anchovies',
  'mince', 'veal', 'goat', 'venison', 'chorizo', 'pancetta', 'gelatine', 'gelatin',
]

/**
 * Conservative vegetarian check: excludes recipes with a definitively
 * meat/fish category, or whose title/ingredients mention a common meat
 * keyword. This can't reliably confirm a recipe IS vegetarian (TheMealDB
 * has no diet-tag field beyond the Vegetarian/Vegan categories) — it only
 * excludes recipes that are clearly NOT, per the "only implement what can
 * be reasonably inferred" constraint.
 */
export const isVegetarianFriendly = (recipe: Pick<ApiRecipe, 'category' | 'title' | 'ingredients'>): boolean => {
  const categoryKey = recipe.category?.trim().toLowerCase()
  if (categoryKey && MEAT_CATEGORIES.has(categoryKey)) return false
  const haystack = `${recipe.title} ${recipe.ingredients.map((i) => i.name).join(' ')}`.toLowerCase()
  return !MEAT_KEYWORDS.some((word) => new RegExp(`\\b${word}\\b`).test(haystack))
}
