export type MealInterest = 'dinner' | 'lunch' | 'breakfast' | 'snacks' | 'desserts'
export type CookingTimePreference = 'under20' | '20to40' | '40to60' | 'any'
export type InventoryImportance = 'inventory_first' | 'balanced' | 'discovery'
export type DietaryPreference = 'none' | 'vegetarian'
export type HouseholdSize = '1' | '2' | '3-4' | '5+'

export interface RecipePreferences {
  mealInterests: MealInterest[]
  cookingTime: CookingTimePreference
  inventoryImportance: InventoryImportance
  dietary: DietaryPreference
  householdSize: HouseholdSize
  /**
   * Ingredients the user wants to avoid — a mix of preset keys (see
   * AvoidedPresetKey in lib/avoidedIngredients.ts, e.g. "milk", "peanuts")
   * and free-typed custom text, stored exactly as entered. Kitchen only
   * checks TheMealDB's listed ingredient text — this is never a verified
   * allergen database, see lib/avoidedIngredients.ts.
   */
  avoidedIngredients: string[]
  /** Whether the one-time preferences quiz has been completed or explicitly skipped. */
  setupSeen: boolean
}

/** Safe default profile — equivalent to "no preferences configured yet". */
export const DEFAULT_RECIPE_PREFERENCES: RecipePreferences = {
  mealInterests: ['dinner'],
  cookingTime: 'any',
  inventoryImportance: 'balanced',
  dietary: 'none',
  householdSize: '1',
  avoidedIngredients: [],
  setupSeen: false,
}
