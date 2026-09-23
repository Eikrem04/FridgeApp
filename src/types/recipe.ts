/**
 * Provider-independent recipe model. UI code must only ever see these
 * shapes — no TheMealDB field names (strMeal, strIngredient1, ...) beyond
 * the adapter in src/lib/recipeApi/.
 */

export interface RecipeIngredient {
  name: string
  measure?: string
}

export interface ApiRecipeSummary {
  id: string
  title: string
  imageUrl?: string
}

export interface ApiRecipe extends ApiRecipeSummary {
  category?: string
  area?: string
  instructions?: string
  ingredients: RecipeIngredient[]
  sourceUrl?: string
  youtubeUrl?: string
}

/** A small, explainable meal-type bucket derived from TheMealDB's category (see recipeClassification.ts). */
export type MealClass = 'main' | 'breakfast' | 'dessert' | 'snack' | 'unknown'

export interface RecipeMatch {
  recipe: ApiRecipe
  matched: RecipeIngredient[]
  missing: RecipeIngredient[]
  matchCount: number
  totalCount: number
  /** matchCount / totalCount, 0 when the recipe has no parsed ingredients. */
  score: number
  /** How many matched ingredients also appear in the caller's "use soon" set. */
  usesSoonCount: number
  mealClass: MealClass
}
