export type StorageTypeRow = 'fridge' | 'freezer' | 'pantry'
export type StatEventTypeRow = 'added' | 'consumed' | 'expired' | 'discarded'
export type NotificationTimingRow = '0' | '1' | '2' | '3' | 'never'
export type ThemeRow = 'light' | 'dark' | 'system'
export type LanguageRow = 'system' | 'en' | 'nb'

export type MealInterestRow = 'dinner' | 'lunch' | 'breakfast' | 'snacks' | 'desserts'
export type CookingTimeRow = 'under20' | '20to40' | '40to60' | 'any'
export type InventoryImportanceRow = 'inventory_first' | 'balanced' | 'discovery'
export type DietaryPreferenceRow = 'none' | 'vegetarian'
export type HouseholdSizeRow = '1' | '2' | '3-4' | '5+'

export interface RecipePreferencesRow {
  mealInterests: MealInterestRow[]
  cookingTime: CookingTimeRow
  inventoryImportance: InventoryImportanceRow
  dietary: DietaryPreferenceRow
  householdSize: HouseholdSizeRow
  /** Optional at the type level — rows saved before this field existed won't have it; see settingsFromRow. */
  avoidedIngredients?: string[]
  setupSeen: boolean
}

export type MealTypeRow = 'breakfast' | 'lunch' | 'dinner'

/** Shape of one element of recipes.ingredients (jsonb) — see supabase/migrations/0009_recipes.sql. */
export interface RecipeIngredientRow {
  canonical_name: string
  name_en: string
  name_nb: string
  measure_en?: string | null
  measure_nb?: string | null
}

export interface Database {
  public: {
    Tables: {
      storage_units: {
        Row: {
          id: string
          user_id: string
          name: string
          type: StorageTypeRow
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: StorageTypeRow
          created_at?: string
        }
        Update: Partial<{
          id: string
          user_id: string
          name: string
          type: StorageTypeRow
          created_at: string
        }>
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          is_custom: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          is_custom?: boolean
          created_at?: string
        }
        Update: Partial<{
          id: string
          user_id: string
          name: string
          icon: string
          is_custom: boolean
          created_at: string
        }>
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          user_id: string
          storage_id: string
          category_id: string | null
          name: string
          quantity: number
          unit: string
          expiration_date: string | null
          notes: string | null
          image_url: string | null
          date_added: string
          is_favorite: boolean
        }
        Insert: {
          id?: string
          user_id: string
          storage_id: string
          category_id?: string | null
          name: string
          quantity?: number
          unit?: string
          expiration_date?: string | null
          notes?: string | null
          image_url?: string | null
          date_added?: string
          is_favorite?: boolean
        }
        Update: Partial<{
          id: string
          user_id: string
          storage_id: string
          category_id: string | null
          name: string
          quantity: number
          unit: string
          expiration_date: string | null
          notes: string | null
          image_url: string | null
          date_added: string
          is_favorite: boolean
        }>
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          id: string
          user_id: string
          name: string
          quantity: number | null
          unit: string | null
          category_id: string | null
          purchased: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          quantity?: number | null
          unit?: string | null
          category_id?: string | null
          purchased?: boolean
          created_at?: string
        }
        Update: Partial<{
          id: string
          user_id: string
          name: string
          quantity: number | null
          unit: string | null
          category_id: string | null
          purchased: boolean
          created_at: string
        }>
        Relationships: []
      }
      stat_events: {
        Row: {
          id: string
          user_id: string
          type: StatEventTypeRow
          item_name: string
          category_id: string | null
          quantity: number
          occurred_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: StatEventTypeRow
          item_name: string
          category_id?: string | null
          quantity?: number
          occurred_at?: string
        }
        Update: Partial<{
          id: string
          user_id: string
          type: StatEventTypeRow
          item_name: string
          category_id: string | null
          quantity: number
          occurred_at: string
        }>
        Relationships: []
      }
      user_settings: {
        Row: {
          user_id: string
          theme: ThemeRow
          language: LanguageRow
          onboarding_complete: boolean
          user_name: string | null
          notifications_enabled: boolean
          notifications_timing: NotificationTimingRow
          expiring_soon_days: number
          recipe_preferences: RecipePreferencesRow
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: ThemeRow
          language?: LanguageRow
          onboarding_complete?: boolean
          user_name?: string | null
          notifications_enabled?: boolean
          notifications_timing?: NotificationTimingRow
          expiring_soon_days?: number
          recipe_preferences?: RecipePreferencesRow
          created_at?: string
          updated_at?: string
        }
        Update: Partial<{
          user_id: string
          theme: ThemeRow
          language: LanguageRow
          onboarding_complete: boolean
          user_name: string | null
          notifications_enabled: boolean
          notifications_timing: NotificationTimingRow
          expiring_soon_days: number
          recipe_preferences: RecipePreferencesRow
          created_at: string
          updated_at: string
        }>
        Relationships: []
      }
      known_products: {
        Row: {
          id: string
          user_id: string
          barcode: string
          name: string
          brand: string | null
          category_id: string | null
          unit: string | null
          image_url: string | null
          source: string
          last_used_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          barcode: string
          name: string
          brand?: string | null
          category_id?: string | null
          unit?: string | null
          image_url?: string | null
          source?: string
          last_used_at?: string
          created_at?: string
        }
        Update: Partial<{
          id: string
          user_id: string
          barcode: string
          name: string
          brand: string | null
          category_id: string | null
          unit: string | null
          image_url: string | null
          source: string
          last_used_at: string
          created_at: string
        }>
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          slug: string
          title_en: string
          title_nb: string
          meal_type: MealTypeRow[]
          category: string | null
          is_vegetarian: boolean
          ingredients: RecipeIngredientRow[]
          instructions_en: string | null
          instructions_nb: string | null
          source_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title_en: string
          title_nb: string
          meal_type: MealTypeRow[]
          category?: string | null
          is_vegetarian?: boolean
          ingredients: RecipeIngredientRow[]
          instructions_en?: string | null
          instructions_nb?: string | null
          source_url?: string | null
          created_at?: string
        }
        Update: Partial<{
          id: string
          slug: string
          title_en: string
          title_nb: string
          meal_type: MealTypeRow[]
          category: string | null
          is_vegetarian: boolean
          ingredients: RecipeIngredientRow[]
          instructions_en: string | null
          instructions_nb: string | null
          source_url: string | null
          created_at: string
        }>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      /** Atomically applies a +/- delta to an item's quantity in the database, clamped at 0. See 0008_atomic_inventory_quantity.sql. */
      adjust_inventory_item_quantity: {
        Args: { p_item_id: string; p_delta: number }
        Returns: number
      }
    }
  }
}
