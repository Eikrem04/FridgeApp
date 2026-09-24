import type { ApiRecipe, MealType } from '../types/recipe'
import type { MealInterest } from '../types/recipePreferences'

/**
 * Kitch's curated recipes carry their own authored `mealType` (see supabase/migrations/0009_recipes.sql)
 * — unlike the old TheMealDB integration, there's no category/title-guessing needed, so this is a
 * direct passthrough. Kept as a named function (rather than inlining `recipe.mealType` at every
 * call site) so computeRecipeMatch/tests have one obvious place this comes from.
 */
export const classifyRecipe = (recipe: Pick<ApiRecipe, 'mealType'>): MealType[] => recipe.mealType

/** Which meal interests each authored meal type satisfies. */
const MEAL_TYPE_INTERESTS: Record<MealType, MealInterest[]> = {
  breakfast: ['breakfast'],
  lunch: ['lunch'],
  dinner: ['dinner'],
}

const INTEREST_LABEL_KEY: Record<MealInterest, string> = {
  dinner: 'match.goodDinnerMatch',
  lunch: 'match.goodLunchMatch',
  breakfast: 'match.goodBreakfastMatch',
  snacks: 'match.goodSnackMatch',
  desserts: 'match.goodDessertMatch',
}

/** Display priority when a recipe's meal types satisfy more than one selected interest. */
const INTEREST_PRIORITY: MealInterest[] = ['dinner', 'lunch', 'breakfast', 'desserts', 'snacks']

/**
 * Returns the translation key for a "Good X match" badge if any of this recipe's authored meal
 * types fits one of the user's selected meal interests, else null. Doubles as the fit check used
 * for ranking/filtering — a single source of truth for "does this recipe fit what the user said
 * they cook". Note: the curated catalog currently only ever authors breakfast/lunch/dinner, so a
 * user who has only selected "Snacks"/"Desserts" as their interest will see no fits — expected
 * given today's content, not a bug.
 */
export const preferenceFitLabelKey = (mealTypes: MealType[], interests: MealInterest[]): string | null => {
  const matchingInterests = interests.filter((interest) => mealTypes.some((type) => MEAL_TYPE_INTERESTS[type].includes(interest)))
  if (matchingInterests.length === 0) return null
  const chosen = INTEREST_PRIORITY.find((interest) => matchingInterests.includes(interest)) ?? matchingInterests[0]
  return INTEREST_LABEL_KEY[chosen]
}
