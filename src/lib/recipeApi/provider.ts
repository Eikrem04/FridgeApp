import type { ApiRecipe } from '../../types/recipe'

/**
 * Everything the app needs from a recipe backend. The curated Kitch catalog is small enough
 * (dozens, not thousands of recipes) to fetch in full and cache — so, unlike the old TheMealDB
 * integration, there's no need for a server-side per-ingredient filter endpoint; `searchByName`
 * and `getById` can both be served from the same cached set `getAllRecipes` returns.
 */
export interface RecipeProvider {
  /** Fetches (and internally caches) the full curated recipe catalog. */
  getAllRecipes(signal?: AbortSignal): Promise<ApiRecipe[]>
  searchByName(query: string, signal: AbortSignal): Promise<ApiRecipe[]>
  getById(id: string, signal: AbortSignal): Promise<ApiRecipe | null>
}
