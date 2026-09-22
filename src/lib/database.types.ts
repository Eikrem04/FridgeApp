export type StorageTypeRow = 'fridge' | 'freezer' | 'pantry'
export type StatEventTypeRow = 'added' | 'consumed' | 'expired' | 'discarded'
export type NotificationTimingRow = '0' | '1' | '2' | '3' | 'never'
export type ThemeRow = 'light' | 'dark' | 'system'
export type LanguageRow = 'system' | 'en' | 'nb'

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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
