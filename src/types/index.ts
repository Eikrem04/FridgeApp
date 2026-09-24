import type { RecipePreferences } from './recipePreferences'

export type StorageType = 'fridge' | 'freezer' | 'pantry'

export interface StorageUnit {
  id: string
  name: string
  type: StorageType
  icon?: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  isCustom: boolean
}

export interface InventoryItem {
  id: string
  name: string
  categoryId: string
  quantity: number
  unit: string
  storageId: string
  expirationDate: string | null // ISO date (yyyy-MM-dd), null = no expiration
  notes?: string
  imageUrl?: string
  dateAdded: string // ISO datetime
  isFavorite?: boolean
}

export interface ShoppingListItem {
  id: string
  name: string
  quantity?: number
  unit?: string
  categoryId?: string
  purchased: boolean
  createdAt: string
}

export type NotificationTiming = 0 | 1 | 2 | 3 | 'never'

export interface NotificationSettings {
  enabled: boolean
  timing: NotificationTiming
  browserPermission: NotificationPermission | 'unsupported'
}

export interface ExpirationSettings {
  expiringSoonDays: number
}

export type ThemePreference = 'light' | 'dark' | 'system'

/** 'system' resolves at runtime from the browser/device locale — see src/i18n/index.ts. */
export type LanguagePreference = 'system' | 'en' | 'nb'

export interface AppSettings {
  onboardingComplete: boolean
  theme: ThemePreference
  language: LanguagePreference
  notifications: NotificationSettings
  expiration: ExpirationSettings
  recipePreferences: RecipePreferences
  userName?: string
}

export type ExpirationStatus = 'fresh' | 'expiringSoon' | 'expiresToday' | 'expired' | 'none'

export type StatEventType = 'added' | 'consumed' | 'expired' | 'discarded'

export interface StatEvent {
  id: string
  type: StatEventType
  itemName: string
  categoryId?: string
  quantity: number
  date: string // ISO datetime
}

export interface InAppNotification {
  id: string
  title: string
  body: string
  itemId?: string
  createdAt: string
  read: boolean
}

