import type { ApiRecipe, RecipeMatch } from '../types/recipe'
import type { InventoryImportance, RecipePreferences } from '../types/recipePreferences'
import { computeRecipeMatch } from './recipeIngredients'
import { classifyRecipe, isVegetarianFriendly, preferenceFitLabelKey } from './recipeClassification'
import { recipeContainsAvoidedIngredient } from './avoidedIngredients'

/**
 * How strongly matched/missing ingredient counts weigh into the inventory
 * relevance score, per inventory-importance mode. Deliberately simple
 * numbers, not tuned by data — the point is a clear, explainable direction:
 * inventory_first leans hard on both signals, discovery barely penalizes
 * missing ingredients, balanced sits between the two (close to the
 * pre-preferences behavior).
 */
const INVENTORY_WEIGHTS: Record<InventoryImportance, { match: number; missing: number }> = {
  inventory_first: { match: 3, missing: 2 },
  balanced: { match: 2, missing: 1 },
  discovery: { match: 1, missing: 0.25 },
}

/**
 * Ranks candidate recipes for the Suggestions tab using the user's recipe
 * preferences. Priority order (highest first), matching the product spec:
 *   1. Recipe type/preference fit  — recipes whose class (main/breakfast/
 *      dessert/snack) doesn't satisfy ANY selected meal interest are
 *      dropped outright (e.g. desserts when only Dinner is selected).
 *      Recipes of unrecognized class ("unknown") are kept but rank below
 *      a confirmed fit, never above one.
 *   2. Inventory relevance — matchCount and missing.length combined via
 *      the mode weights above into one score.
 *   3. Use-soon boost — more matched ingredients expiring soon ranks higher.
 *   4. Fewest missing ingredients, as a final deterministic tiebreak.
 * Vegetarian filtering (when selected) is applied before ranking, for the
 * same reason as the meal-class filter: it's a personal profile setting,
 * scoped to these personalized suggestions only (Search results are never
 * filtered by it — see Recipes.tsx).
 *
 * Avoided ingredients (allergy-style preferences) are also excluded here,
 * before ranking — never re-added afterward just to pad out the list. See
 * lib/avoidedIngredients.ts for the important safety caveats on this check.
 */
export const rankSuggestionsByPreference = (
  recipes: ApiRecipe[],
  ownedNames: string[],
  useSoonNames: string[],
  preferences: RecipePreferences,
): RecipeMatch[] => {
  const candidates = recipes.filter((recipe) => {
    if (preferences.dietary === 'vegetarian' && !isVegetarianFriendly(recipe)) return false
    if (recipeContainsAvoidedIngredient(recipe, preferences.avoidedIngredients)) return false
    const mealClass = classifyRecipe(recipe)
    return mealClass === 'unknown' || preferenceFitLabelKey(mealClass, preferences.mealInterests) !== null
  })

  const weights = INVENTORY_WEIGHTS[preferences.inventoryImportance]

  return candidates
    .map((recipe) => computeRecipeMatch(recipe, ownedNames, useSoonNames))
    .sort((a, b) => {
      const aFit = preferenceFitLabelKey(a.mealClass, preferences.mealInterests) !== null ? 1 : 0
      const bFit = preferenceFitLabelKey(b.mealClass, preferences.mealInterests) !== null ? 1 : 0
      if (bFit !== aFit) return bFit - aFit

      const aInventoryScore = weights.match * a.matchCount - weights.missing * a.missing.length
      const bInventoryScore = weights.match * b.matchCount - weights.missing * b.missing.length
      if (bInventoryScore !== aInventoryScore) return bInventoryScore - aInventoryScore

      if (b.usesSoonCount !== a.usesSoonCount) return b.usesSoonCount - a.usesSoonCount

      return a.missing.length - b.missing.length
    })
}
