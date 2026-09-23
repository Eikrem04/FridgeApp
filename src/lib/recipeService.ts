import type { InventoryItem } from '../types'
import type { ApiRecipe, ApiRecipeSummary, RecipeMatch } from '../types/recipe'
import type { RecipePreferences } from '../types/recipePreferences'
import { recipeProvider } from './recipeApi'
import { pickQueryableIngredients, uniqueItemNames } from './recipeIngredients'
import { rankSuggestionsByPreference } from './recipeRanking'

/** TheMealDB's free tier filters by one ingredient at a time, so suggestions query at most this many. */
const MAX_QUERY_INGREDIENTS = 5
/**
 * Upper bound on how many candidate recipes get a full detail fetch per
 * suggestion request. Slightly higher than a bare match-ranking pipeline
 * would need, since preference filtering (meal type, dietary) can now drop
 * a chunk of candidates before ranking — this keeps enough headroom that a
 * dinner-focused user still sees a full list even after desserts etc. are
 * filtered out, without making the candidate pool unbounded.
 */
const MAX_CANDIDATE_RECIPES = 16
const MAX_SUGGESTIONS = 10
const CONCURRENCY = 4

// Session-lifetime, in-memory only — never persisted, never sent anywhere else.
const detailCache = new Map<string, ApiRecipe>()
const searchCache = new Map<string, ApiRecipe[]>()
const ingredientFilterCache = new Map<string, ApiRecipeSummary[]>()

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const worker = async () => {
    while (cursor < items.length) {
      const current = cursor++
      results[current] = await fn(items[current])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export const searchRecipes = async (query: string, signal: AbortSignal): Promise<ApiRecipe[]> => {
  const key = query.trim().toLowerCase()
  const cached = searchCache.get(key)
  if (cached) return cached
  const results = await recipeProvider.searchByName(query, signal)
  // search.php already returns full detail, so seed the detail cache for free.
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

const filterByIngredientCached = async (term: string, signal: AbortSignal): Promise<ApiRecipeSummary[]> => {
  const cached = ingredientFilterCache.get(term)
  if (cached) return cached
  const results = await recipeProvider.searchByIngredient(term, signal)
  ingredientFilterCache.set(term, results)
  return results
}

/**
 * Suggests recipes from the user's current inventory: picks a bounded set of
 * recognized ingredients (favoring ones expiring soon), queries TheMealDB's
 * single-ingredient filter for each, dedupes the candidate recipe ids
 * (recipes appearing under multiple queried ingredients are prioritized —
 * they already share more than one matched ingredient), fetches full detail
 * for a bounded number of candidates, then ranks locally by match quality.
 */
export const getSuggestions = async (
  items: InventoryItem[],
  useSoonItems: InventoryItem[],
  preferences: RecipePreferences,
  signal: AbortSignal,
): Promise<RecipeMatch[]> => {
  const queryTerms = pickQueryableIngredients(items, useSoonItems, MAX_QUERY_INGREDIENTS)
  if (queryTerms.length === 0) return []

  const filterResultLists = await mapWithConcurrency(queryTerms, CONCURRENCY, (term) =>
    filterByIngredientCached(term, signal).catch(() => [] as ApiRecipeSummary[]),
  )

  const frequency = new Map<string, { summary: ApiRecipeSummary; count: number }>()
  for (const list of filterResultLists) {
    for (const summary of list) {
      const existing = frequency.get(summary.id)
      if (existing) existing.count += 1
      else frequency.set(summary.id, { summary, count: 1 })
    }
  }

  const candidateIds = Array.from(frequency.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_CANDIDATE_RECIPES)
    .map((entry) => entry.summary.id)

  const details = await mapWithConcurrency(candidateIds, CONCURRENCY, (id) => getRecipeDetail(id, signal).catch(() => null))
  const recipes = details.filter((r): r is ApiRecipe => r !== null)

  const ownedNames = uniqueItemNames(items)
  const useSoonNames = uniqueItemNames(useSoonItems)
  return rankSuggestionsByPreference(recipes, ownedNames, useSoonNames, preferences).slice(0, MAX_SUGGESTIONS)
}

export { computeRecipeMatch } from './recipeIngredients'
