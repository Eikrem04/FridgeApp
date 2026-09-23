import type { ApiRecipe, ApiRecipeSummary } from '../../types/recipe'

/**
 * Everything the app needs from a recipe backend. Swapping TheMealDB for a
 * different API (or a server-side proxy in front of one) means writing a new
 * implementation of this interface and changing the one wiring point in
 * index.ts — the UI and recipeService.ts never depend on a specific provider.
 */
export interface RecipeProvider {
  searchByName(query: string, signal: AbortSignal): Promise<ApiRecipe[]>
  getById(id: string, signal: AbortSignal): Promise<ApiRecipe | null>
  /** TheMealDB's free tier only supports filtering by a single ingredient at a time. */
  searchByIngredient(ingredient: string, signal: AbortSignal): Promise<ApiRecipeSummary[]>
}
