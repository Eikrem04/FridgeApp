import type { InventoryItem } from '../types'
import type { ApiRecipe, RecipeMatch } from '../types/recipe'
import type { RecipePreferences } from '../types/recipePreferences'
import { recipeProvider } from './recipeApi'
import { uniqueItemNames } from './recipeIngredients'
import { rankSuggestionsByPreference } from './recipeRanking'

const MAX_SUGGESTIONS = 10

// Session-lifetime, in-memory only — never persisted, never sent anywhere else.
const detailCache = new Map<string, ApiRecipe>()
const searchCache = new Map<string, ApiRecipe[]>()

export const searchRecipes = async (query: string, signal: AbortSignal): Promise<ApiRecipe[]> => {
  const key = query.trim().toLowerCase()
  const cached = searchCache.get(key)
  if (cached) return cached
  const results = await recipeProvider.searchByName(query, signal)
  for (const recipe of results) detailCache.set(recipe.id, recipe)
  searchCache.set(key, results)
  return results
}

export const getRecipeDetail = async (id: string, signal: AbortSignal): Promise<ApiRecipe | null> => {
  const cached = detailCache.get(id)
  if (cached) return cached
  const detail = await recipeProvider.getById(id, signal)
  if (detail) detailCache.set(id, detail)
  return detail
}

/**
 * Suggests recipes from the user's current inventory. Unlike the old TheMealDB-backed version,
 * the curated catalog is small enough to fetch and rank in full — no per-ingredient querying,
 * candidate-frequency deduping, or concurrency-limited fan-out needed; those all existed solely
 * to work around TheMealDB's one-ingredient-at-a-time filter endpoint.
 */
export const getSuggestions = async (
  items: InventoryItem[],
  useSoonItems: InventoryItem[],
  preferences: RecipePreferences,
  signal: AbortSignal,
): Promise<RecipeMatch[]> => {
  const recipes = await recipeProvider.getAllRecipes(signal)
  for (const recipe of recipes) detailCache.set(recipe.id, recipe)

  const ownedNames = uniqueItemNames(items)
  const useSoonNames = uniqueItemNames(useSoonItems)
  return rankSuggestionsByPreference(recipes, ownedNames, useSoonNames, preferences).slice(0, MAX_SUGGESTIONS)
}

export { computeRecipeMatch } from './recipeIngredients'
