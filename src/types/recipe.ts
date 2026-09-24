/**
 * Provider-independent recipe model. UI code must only ever see these
 * shapes — no Supabase row/column names beyond the adapter in src/lib/recipeApi/.
 */

export interface RecipeIngredient {
  /** Canonical, stable, always-English name — used for inventory and avoided-ingredient matching. Never shown as-is if `displayName` is set. */
  name: string
  /** Localized name for the active app language. Falls back to `name` when a display name isn't available. */
  displayName?: string
  measure?: string
}

export interface ApiRecipeSummary {
  id: string
  title: string
  imageUrl?: string
}

export interface ApiRecipe extends ApiRecipeSummary {
  category?: string
  instructions?: string
  ingredients: RecipeIngredient[]
  isVegetarian: boolean
  /** One or more of breakfast/lunch/dinner — authored directly on the recipe, never inferred. */
  mealType: MealType[]
  sourceUrl?: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner'

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
  mealClass: MealType[]
}
