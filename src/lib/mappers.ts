import type { Database } from './database.types'
import type {
  AppSettings,
  Category,
  InventoryItem,
  ShoppingListItem,
  StatEvent,
  StorageUnit,
} from '../types'

type StorageUnitRow = Database['public']['Tables']['storage_units']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type InventoryItemRow = Database['public']['Tables']['inventory_items']['Row']
type ShoppingListItemRow = Database['public']['Tables']['shopping_list_items']['Row']
type StatEventRow = Database['public']['Tables']['stat_events']['Row']
type UserSettingsRow = Database['public']['Tables']['user_settings']['Row']

export const storageUnitFromRow = (row: StorageUnitRow): StorageUnit => ({
  id: row.id,
  name: row.name,
  type: row.type,
  createdAt: row.created_at,
})

export const categoryFromRow = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  isCustom: row.is_custom,
})

export const itemFromRow = (row: InventoryItemRow): InventoryItem => ({
  id: row.id,
  name: row.name,
  categoryId: row.category_id ?? '',
  quantity: Number(row.quantity),
  unit: row.unit,
  storageId: row.storage_id,
  expirationDate: row.expiration_date,
  notes: row.notes ?? undefined,
  imageUrl: row.image_url ?? undefined,
  dateAdded: row.date_added,
  isFavorite: row.is_favorite,
})

export const shoppingItemFromRow = (row: ShoppingListItemRow): ShoppingListItem => ({
  id: row.id,
  name: row.name,
  quantity: row.quantity ?? undefined,
  unit: row.unit ?? undefined,
  categoryId: row.category_id ?? undefined,
  purchased: row.purchased,
  createdAt: row.created_at,
})

export const statEventFromRow = (row: StatEventRow): StatEvent => ({
  id: row.id,
  type: row.type,
  itemName: row.item_name,
  categoryId: row.category_id ?? undefined,
  quantity: Number(row.quantity),
  date: row.occurred_at,
})

export const settingsFromRow = (row: UserSettingsRow): AppSettings => ({
  onboardingComplete: row.onboarding_complete,
  theme: row.theme,
  userName: row.user_name ?? undefined,
  notifications: {
    enabled: row.notifications_enabled,
    timing: row.notifications_timing === 'never' ? 'never' : (Number(row.notifications_timing) as 0 | 1 | 2 | 3),
    browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  },
  expiration: {
    expiringSoonDays: row.expiring_soon_days,
  },
})

export const settingsToRow = (
  userId: string,
  settings: Partial<AppSettings>,
): Database['public']['Tables']['user_settings']['Insert'] => {
  const row: Database['public']['Tables']['user_settings']['Insert'] = { user_id: userId }
  if (settings.onboardingComplete !== undefined) row.onboarding_complete = settings.onboardingComplete
  if (settings.theme !== undefined) row.theme = settings.theme
  if (settings.userName !== undefined) row.user_name = settings.userName ?? null
  if (settings.notifications !== undefined) {
    row.notifications_enabled = settings.notifications.enabled
    row.notifications_timing = String(settings.notifications.timing) as Database['public']['Tables']['user_settings']['Row']['notifications_timing']
  }
  if (settings.expiration !== undefined) row.expiring_soon_days = settings.expiration.expiringSoonDays
  row.updated_at = new Date().toISOString()
  return row
}
