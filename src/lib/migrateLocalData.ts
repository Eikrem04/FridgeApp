import { supabase } from './supabase'
import { makeId } from './id'
import type { AppSettings, Category, InventoryItem, ShoppingListItem, StatEvent, StorageUnit } from '../types'

export const LEGACY_STORAGE_KEY = 'fridgeapp-storage-v1'

export interface LegacyBackup {
  storageUnits: StorageUnit[]
  categories: Category[]
  items: InventoryItem[]
  shoppingList: ShoppingListItem[]
  settings: AppSettings
  statEvents: StatEvent[]
}

const isNonEmptyBackup = (backup: LegacyBackup): boolean =>
  backup.storageUnits.length > 0 || backup.items.length > 0 || backup.shoppingList.length > 0

export const getLegacyLocalData = (): LegacyBackup | null => {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const state = parsed?.state ?? parsed
    const backup: LegacyBackup = {
      storageUnits: state?.storageUnits ?? [],
      categories: state?.categories ?? [],
      items: state?.items ?? [],
      shoppingList: state?.shoppingList ?? [],
      settings: state?.settings ?? {},
      statEvents: state?.statEvents ?? [],
    }
    return isNonEmptyBackup(backup) ? backup : null
  } catch {
    return null
  }
}

export const clearLegacyLocalData = (): void => {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // ignore — nothing we can do if storage is unavailable
  }
}

export interface ImportCounts {
  storageUnits: number
  items: number
  shoppingList: number
  categories: number
}

/**
 * Pushes a backup (either a legacy localStorage snapshot or an exported JSON
 * file) into the signed-in user's Supabase tables. Default categories are
 * matched onto the ones already seeded for the account by name, so re-running
 * an import never creates duplicate "Dairy", "Meat", etc.
 */
export const importBackupToCloud = async (
  userId: string,
  backup: LegacyBackup,
  existingCategories: Category[],
): Promise<ImportCounts> => {
  const categoryIdMap = new Map<string, string>()
  const categoriesToInsert: { id: string; user_id: string; name: string; icon: string; is_custom: boolean }[] = []

  for (const cat of backup.categories ?? []) {
    const match = existingCategories.find((c) => c.name.toLowerCase() === cat.name.toLowerCase())
    if (match) {
      categoryIdMap.set(cat.id, match.id)
    } else {
      const newId = makeId()
      categoryIdMap.set(cat.id, newId)
      categoriesToInsert.push({ id: newId, user_id: userId, name: cat.name, icon: cat.icon || 'Package', is_custom: true })
    }
  }

  if (categoriesToInsert.length > 0) {
    const { error } = await supabase.from('categories').insert(categoriesToInsert)
    if (error) throw error
  }

  const fallbackCategoryId = existingCategories.find((c) => c.name.toLowerCase() === 'other')?.id ?? null
  const resolveCategoryId = (id: string | undefined) => (id ? categoryIdMap.get(id) ?? fallbackCategoryId : fallbackCategoryId)

  const storageUnits = backup.storageUnits ?? []
  if (storageUnits.length > 0) {
    const { error } = await supabase.from('storage_units').insert(
      storageUnits.map((u) => ({ id: u.id, user_id: userId, name: u.name, type: u.type, created_at: u.createdAt })),
    )
    if (error) throw error
  }

  const items = backup.items ?? []
  if (items.length > 0) {
    const { error } = await supabase.from('inventory_items').insert(
      items.map((it) => ({
        id: it.id,
        user_id: userId,
        storage_id: it.storageId,
        category_id: resolveCategoryId(it.categoryId),
        name: it.name,
        quantity: it.quantity,
        unit: it.unit,
        expiration_date: it.expirationDate,
        notes: it.notes ?? null,
        image_url: it.imageUrl ?? null,
        date_added: it.dateAdded,
        is_favorite: it.isFavorite ?? false,
      })),
    )
    if (error) throw error
  }

  const shoppingList = backup.shoppingList ?? []
  if (shoppingList.length > 0) {
    const { error } = await supabase.from('shopping_list_items').insert(
      shoppingList.map((s) => ({
        id: s.id,
        user_id: userId,
        name: s.name,
        quantity: s.quantity ?? null,
        unit: s.unit ?? null,
        category_id: resolveCategoryId(s.categoryId),
        purchased: s.purchased,
        created_at: s.createdAt,
      })),
    )
    if (error) throw error
  }

  const statEvents = backup.statEvents ?? []
  if (statEvents.length > 0) {
    const { error } = await supabase.from('stat_events').insert(
      statEvents.map((e) => ({
        id: e.id,
        user_id: userId,
        type: e.type,
        item_name: e.itemName,
        category_id: resolveCategoryId(e.categoryId),
        quantity: e.quantity,
        occurred_at: e.date,
      })),
    )
    if (error) throw error
  }

  if (backup.settings) {
    const timing = backup.settings.notifications?.timing
    await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        onboarding_complete: true,
        theme: backup.settings.theme ?? 'system',
        user_name: backup.settings.userName ?? null,
        notifications_enabled: backup.settings.notifications?.enabled ?? true,
        notifications_timing: (timing !== undefined ? String(timing) : '1') as '0' | '1' | '2' | '3' | 'never',
        expiring_soon_days: backup.settings.expiration?.expiringSoonDays ?? 3,
      },
      { onConflict: 'user_id' },
    )
  }

  return {
    storageUnits: storageUnits.length,
    items: items.length,
    shoppingList: shoppingList.length,
    categories: categoriesToInsert.length,
  }
}
