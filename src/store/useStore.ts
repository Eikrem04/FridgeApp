import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type {
  AppSettings,
  Category,
  InAppNotification,
  InventoryItem,
  ShoppingListItem,
  StatEvent,
  StatEventType,
  StorageType,
  StorageUnit,
  ThemePreference,
} from '../types'
import { makeId } from '../lib/id'
import { nowISO, todayISODate } from '../lib/date'
import { findDuplicateItem } from '../lib/inventory'
import {
  categoryFromRow,
  itemFromRow,
  settingsFromRow,
  settingsToRow,
  shoppingItemFromRow,
  statEventFromRow,
  storageUnitFromRow,
} from '../lib/mappers'
import { useToastStore } from './useToastStore'
import { importBackupToCloud, type LegacyBackup } from '../lib/migrateLocalData'

export interface AddItemInput {
  name: string
  categoryId: string
  quantity: number
  unit: string
  storageId: string
  expirationDate: string | null
  notes?: string
  imageUrl?: string
}

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error'

const defaultSettings: AppSettings = {
  onboardingComplete: false,
  theme: 'system',
  notifications: {
    enabled: true,
    timing: 1,
    browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  },
  expiration: {
    expiringSoonDays: 3,
  },
}

const upsert = <T extends { id: string }>(arr: T[], item: T): T[] => {
  const idx = arr.findIndex((x) => x.id === item.id)
  if (idx === -1) return [...arr, item]
  const copy = [...arr]
  copy[idx] = item
  return copy
}

const removeById = <T extends { id: string }>(arr: T[], id: string): T[] => arr.filter((x) => x.id !== id)

const notifyError = (message: string) => useToastStore.getState().show(message)

let activeChannel: RealtimeChannel | null = null

const teardownChannel = () => {
  if (activeChannel) {
    supabase.removeChannel(activeChannel)
    activeChannel = null
  }
}

interface AppState {
  userId: string | null
  dataStatus: DataStatus
  dataError: string | null

  storageUnits: StorageUnit[]
  categories: Category[]
  items: InventoryItem[]
  shoppingList: ShoppingListItem[]
  settings: AppSettings
  statEvents: StatEvent[]
  notifications: InAppNotification[]
  lastNotificationScan: string | null

  // lifecycle
  initializeForUser: (userId: string) => Promise<void>
  teardown: () => void

  // onboarding
  completeOnboarding: (units: { name: string; type: StorageType }[]) => Promise<void>

  // storage units
  addStorageUnit: (name: string, type: StorageType) => Promise<string>
  renameStorageUnit: (id: string, name: string) => Promise<void>
  deleteStorageUnit: (id: string) => Promise<void>

  // categories
  addCategory: (name: string, icon?: string) => Promise<string>
  deleteCategory: (id: string) => Promise<void>

  // items
  addItem: (input: AddItemInput) => Promise<{ merged: boolean; item: InventoryItem }>
  updateItem: (id: string, patch: Partial<InventoryItem>) => Promise<void>
  changeQuantity: (id: string, delta: number) => Promise<InventoryItem | undefined>
  deleteItem: (id: string, reason?: StatEventType) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>

  // shopping list
  addShoppingItem: (name: string, opts?: { quantity?: number; unit?: string; categoryId?: string }) => Promise<void>
  removeShoppingItem: (id: string) => Promise<void>
  togglePurchased: (id: string) => Promise<void>
  clearPurchased: () => Promise<void>
  restockShoppingItem: (id: string, storageId: string, categoryId: string) => Promise<void>

  // settings
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  setTheme: (theme: ThemePreference) => Promise<void>

  // notifications (local-only, ephemeral — not synced across devices)
  syncNotifications: () => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void

  // stats
  addStatEvent: (type: StatEventType, itemName: string, quantity: number, categoryId?: string) => Promise<void>

  // data management
  exportData: () => string
  importData: (json: string) => Promise<boolean>
  resetAllData: () => Promise<void>
}

const emptyData = {
  storageUnits: [] as StorageUnit[],
  categories: [] as Category[],
  items: [] as InventoryItem[],
  shoppingList: [] as ShoppingListItem[],
  settings: defaultSettings,
  statEvents: [] as StatEvent[],
}

export const useStore = create<AppState>()((set, get) => ({
  userId: null,
  dataStatus: 'idle',
  dataError: null,
  ...emptyData,
  notifications: [],
  lastNotificationScan: null,

  initializeForUser: async (userId) => {
    teardownChannel()
    set({ dataStatus: 'loading', dataError: null, userId })

    try {
      const [storageRes, categoriesRes, itemsRes, shoppingRes, statsRes, settingsRes] = await Promise.all([
        supabase.from('storage_units').select('*').order('created_at'),
        supabase.from('categories').select('*').order('created_at'),
        supabase.from('inventory_items').select('*').order('date_added'),
        supabase.from('shopping_list_items').select('*').order('created_at'),
        supabase.from('stat_events').select('*').order('occurred_at'),
        supabase.from('user_settings').select('*').maybeSingle(),
      ])

      const firstError =
        storageRes.error || categoriesRes.error || itemsRes.error || shoppingRes.error || statsRes.error || settingsRes.error
      if (firstError) throw firstError

      set({
        storageUnits: (storageRes.data ?? []).map(storageUnitFromRow),
        categories: (categoriesRes.data ?? []).map(categoryFromRow),
        items: (itemsRes.data ?? []).map(itemFromRow),
        shoppingList: (shoppingRes.data ?? []).map(shoppingItemFromRow),
        statEvents: (statsRes.data ?? []).map(statEventFromRow),
        settings: settingsRes.data ? settingsFromRow(settingsRes.data) : defaultSettings,
        dataStatus: 'ready',
      })

      activeChannel = supabase
        .channel(`kitchen-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'storage_units', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              set((s) => ({ storageUnits: removeById(s.storageUnits, (payload.old as { id: string }).id) }))
            } else {
              set((s) => ({ storageUnits: upsert(s.storageUnits, storageUnitFromRow(payload.new as never)) }))
            }
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              set((s) => ({ categories: removeById(s.categories, (payload.old as { id: string }).id) }))
            } else {
              set((s) => ({ categories: upsert(s.categories, categoryFromRow(payload.new as never)) }))
            }
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'inventory_items', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              set((s) => ({ items: removeById(s.items, (payload.old as { id: string }).id) }))
            } else {
              set((s) => ({ items: upsert(s.items, itemFromRow(payload.new as never)) }))
            }
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'shopping_list_items', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              set((s) => ({ shoppingList: removeById(s.shoppingList, (payload.old as { id: string }).id) }))
            } else {
              set((s) => ({ shoppingList: upsert(s.shoppingList, shoppingItemFromRow(payload.new as never)) }))
            }
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stat_events', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              set((s) => ({ statEvents: removeById(s.statEvents, (payload.old as { id: string }).id) }))
            } else {
              set((s) => ({ statEvents: upsert(s.statEvents, statEventFromRow(payload.new as never)) }))
            }
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType !== 'DELETE') {
              set({ settings: settingsFromRow(payload.new as never) })
            }
          },
        )
        .subscribe()
    } catch (err) {
      set({ dataStatus: 'error', dataError: err instanceof Error ? err.message : 'Failed to load your data.' })
    }
  },

  teardown: () => {
    teardownChannel()
    set({
      userId: null,
      dataStatus: 'idle',
      dataError: null,
      ...emptyData,
      notifications: [],
      lastNotificationScan: null,
    })
  },

  completeOnboarding: async (units) => {
    const userId = get().userId
    if (!userId) return
    const newUnits: StorageUnit[] = units.map((u) => ({ id: makeId(), name: u.name, type: u.type, createdAt: nowISO() }))
    set((s) => ({
      storageUnits: [...s.storageUnits, ...newUnits],
      settings: { ...s.settings, onboardingComplete: true },
    }))

    const { error: unitsError } = await supabase
      .from('storage_units')
      .insert(newUnits.map((u) => ({ id: u.id, user_id: userId, name: u.name, type: u.type, created_at: u.createdAt })))
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, onboarding_complete: true }, { onConflict: 'user_id' })

    if (unitsError || settingsError) {
      notifyError("Something went wrong finishing setup — check your connection and try again.")
    }
  },

  addStorageUnit: async (name, type) => {
    const userId = get().userId
    if (!userId) throw new Error('Not authenticated')
    const id = makeId()
    const unit: StorageUnit = { id, name, type, createdAt: nowISO() }
    set((s) => ({ storageUnits: [...s.storageUnits, unit] }))
    const { error } = await supabase
      .from('storage_units')
      .insert({ id, user_id: userId, name, type, created_at: unit.createdAt })
    if (error) {
      set((s) => ({ storageUnits: removeById(s.storageUnits, id) }))
      notifyError(`Couldn't add ${name}`)
    }
    return id
  },

  renameStorageUnit: async (id, name) => {
    const previous = get().storageUnits.find((u) => u.id === id)
    if (!previous) return
    set((s) => ({ storageUnits: s.storageUnits.map((u) => (u.id === id ? { ...u, name } : u)) }))
    const { error } = await supabase.from('storage_units').update({ name }).eq('id', id)
    if (error) {
      set((s) => ({ storageUnits: s.storageUnits.map((u) => (u.id === id ? previous : u)) }))
      notifyError("Couldn't rename storage")
    }
  },

  deleteStorageUnit: async (id) => {
    const previousUnits = get().storageUnits
    const previousItems = get().items
    set((s) => ({
      storageUnits: s.storageUnits.filter((u) => u.id !== id),
      items: s.items.filter((it) => it.storageId !== id),
    }))
    const { error } = await supabase.from('storage_units').delete().eq('id', id)
    if (error) {
      set({ storageUnits: previousUnits, items: previousItems })
      notifyError("Couldn't delete storage")
    }
  },

  addCategory: async (name, icon = 'Package') => {
    const userId = get().userId
    if (!userId) throw new Error('Not authenticated')
    const id = makeId()
    const category: Category = { id, name, icon, isCustom: true }
    set((s) => ({ categories: [...s.categories, category] }))
    const { error } = await supabase.from('categories').insert({ id, user_id: userId, name, icon, is_custom: true })
    if (error) {
      set((s) => ({ categories: removeById(s.categories, id) }))
      notifyError("Couldn't add category")
    }
    return id
  },

  deleteCategory: async (id) => {
    const category = get().categories.find((c) => c.id === id)
    if (!category || !category.isCustom) return
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      set((s) => ({ categories: [...s.categories, category] }))
      notifyError("Couldn't delete category")
    }
  },

  addItem: async (input) => {
    const userId = get().userId
    if (!userId) throw new Error('Not authenticated')
    const duplicate = findDuplicateItem(get().items, input)
    void get().addStatEvent('added', input.name, input.quantity, input.categoryId)

    if (duplicate) {
      const updated: InventoryItem = { ...duplicate, quantity: duplicate.quantity + input.quantity }
      set((s) => ({ items: upsert(s.items, updated) }))
      const { error } = await supabase.from('inventory_items').update({ quantity: updated.quantity }).eq('id', duplicate.id)
      if (error) {
        set((s) => ({ items: upsert(s.items, duplicate) }))
        notifyError(`Couldn't update ${duplicate.name}`)
      }
      return { merged: true, item: updated }
    }

    const id = makeId()
    const item: InventoryItem = {
      id,
      name: input.name,
      categoryId: input.categoryId,
      quantity: input.quantity,
      unit: input.unit,
      storageId: input.storageId,
      expirationDate: input.expirationDate,
      notes: input.notes,
      imageUrl: input.imageUrl,
      dateAdded: nowISO(),
    }
    set((s) => ({ items: [...s.items, item] }))
    const { error } = await supabase.from('inventory_items').insert({
      id,
      user_id: userId,
      storage_id: input.storageId,
      category_id: input.categoryId || null,
      name: input.name,
      quantity: input.quantity,
      unit: input.unit,
      expiration_date: input.expirationDate,
      notes: input.notes ?? null,
      image_url: input.imageUrl ?? null,
      date_added: item.dateAdded,
    })
    if (error) {
      set((s) => ({ items: removeById(s.items, id) }))
      notifyError(`Couldn't add ${input.name}`)
    }
    return { merged: false, item }
  },

  updateItem: async (id, patch) => {
    const previous = get().items.find((it) => it.id === id)
    if (!previous) return
    const updated = { ...previous, ...patch }
    set((s) => ({ items: upsert(s.items, updated) }))
    const { error } = await supabase
      .from('inventory_items')
      .update({
        name: updated.name,
        category_id: updated.categoryId || null,
        quantity: updated.quantity,
        unit: updated.unit,
        storage_id: updated.storageId,
        expiration_date: updated.expirationDate,
        notes: updated.notes ?? null,
        image_url: updated.imageUrl ?? null,
        is_favorite: updated.isFavorite ?? false,
      })
      .eq('id', id)
    if (error) {
      set((s) => ({ items: upsert(s.items, previous) }))
      notifyError(`Couldn't save changes to ${previous.name}`)
    }
  },

  changeQuantity: async (id, delta) => {
    const previous = get().items.find((it) => it.id === id)
    if (!previous) return undefined
    const nextQuantity = Math.max(0, previous.quantity + delta)
    const consumedAmount = delta < 0 ? previous.quantity - nextQuantity : 0
    const updated = { ...previous, quantity: nextQuantity }
    set((s) => ({ items: upsert(s.items, updated) }))
    const { error } = await supabase.from('inventory_items').update({ quantity: nextQuantity }).eq('id', id)
    if (error) {
      set((s) => ({ items: upsert(s.items, previous) }))
      notifyError("Couldn't update quantity")
      return previous
    }
    if (consumedAmount > 0) {
      void get().addStatEvent('consumed', updated.name, consumedAmount, updated.categoryId)
    }
    return updated
  },

  deleteItem: async (id, reason = 'consumed') => {
    const item = get().items.find((it) => it.id === id)
    if (!item) return
    set((s) => ({ items: removeById(s.items, id) }))
    void get().addStatEvent(reason, item.name, item.quantity, item.categoryId)
    const { error } = await supabase.from('inventory_items').delete().eq('id', id)
    if (error) {
      set((s) => ({ items: upsert(s.items, item) }))
      notifyError(`Couldn't delete ${item.name}`)
    }
  },

  toggleFavorite: async (id) => {
    const item = get().items.find((it) => it.id === id)
    if (!item) return
    const updated = { ...item, isFavorite: !item.isFavorite }
    set((s) => ({ items: upsert(s.items, updated) }))
    const { error } = await supabase.from('inventory_items').update({ is_favorite: updated.isFavorite }).eq('id', id)
    if (error) set((s) => ({ items: upsert(s.items, item) }))
  },

  addShoppingItem: async (name, opts) => {
    const userId = get().userId
    if (!userId) throw new Error('Not authenticated')
    const id = makeId()
    const createdAt = nowISO()
    const shopItem: ShoppingListItem = {
      id,
      name,
      quantity: opts?.quantity,
      unit: opts?.unit,
      categoryId: opts?.categoryId,
      purchased: false,
      createdAt,
    }
    set((s) => ({ shoppingList: [...s.shoppingList, shopItem] }))
    const { error } = await supabase.from('shopping_list_items').insert({
      id,
      user_id: userId,
      name,
      quantity: opts?.quantity ?? null,
      unit: opts?.unit ?? null,
      category_id: opts?.categoryId ?? null,
      purchased: false,
      created_at: createdAt,
    })
    if (error) {
      set((s) => ({ shoppingList: removeById(s.shoppingList, id) }))
      notifyError(`Couldn't add ${name}`)
    }
  },

  removeShoppingItem: async (id) => {
    const previous = get().shoppingList
    set((s) => ({ shoppingList: removeById(s.shoppingList, id) }))
    const { error } = await supabase.from('shopping_list_items').delete().eq('id', id)
    if (error) set({ shoppingList: previous })
  },

  togglePurchased: async (id) => {
    const item = get().shoppingList.find((s) => s.id === id)
    if (!item) return
    const updated = { ...item, purchased: !item.purchased }
    set((s) => ({ shoppingList: upsert(s.shoppingList, updated) }))
    const { error } = await supabase.from('shopping_list_items').update({ purchased: updated.purchased }).eq('id', id)
    if (error) set((s) => ({ shoppingList: upsert(s.shoppingList, item) }))
  },

  clearPurchased: async () => {
    const purchasedIds = get().shoppingList.filter((s) => s.purchased).map((s) => s.id)
    if (purchasedIds.length === 0) return
    const previous = get().shoppingList
    set((s) => ({ shoppingList: s.shoppingList.filter((s2) => !s2.purchased) }))
    const { error } = await supabase.from('shopping_list_items').delete().in('id', purchasedIds)
    if (error) set({ shoppingList: previous })
  },

  restockShoppingItem: async (id, storageId, categoryId) => {
    const shopItem = get().shoppingList.find((s) => s.id === id)
    if (!shopItem) return
    await get().addItem({
      name: shopItem.name,
      categoryId: shopItem.categoryId || categoryId,
      quantity: shopItem.quantity || 1,
      unit: shopItem.unit || 'pcs',
      storageId,
      expirationDate: null,
    })
    const previous = get().shoppingList
    set((s) => ({ shoppingList: removeById(s.shoppingList, id) }))
    const { error } = await supabase.from('shopping_list_items').delete().eq('id', id)
    if (error) set({ shoppingList: previous })
  },

  updateSettings: async (patch) => {
    const userId = get().userId
    if (!userId) return
    const previous = get().settings
    set((s) => ({ settings: { ...s.settings, ...patch } }))
    const row = settingsToRow(userId, patch)
    const { error } = await supabase.from('user_settings').upsert(row, { onConflict: 'user_id' })
    if (error) {
      set({ settings: previous })
      notifyError("Couldn't save settings")
    }
  },

  setTheme: async (theme) => {
    await get().updateSettings({ theme })
  },

  syncNotifications: () => {
    const state = get()
    if (!state.settings.notifications.enabled || state.settings.notifications.timing === 'never') return
    const timing = state.settings.notifications.timing as number
    const today = todayISODate()
    if (state.lastNotificationScan === today) return

    const existingKeys = new Set(state.notifications.map((n) => n.itemId + '|' + n.createdAt.slice(0, 10)))
    const newNotifs: InAppNotification[] = []

    for (const item of state.items) {
      if (!item.expirationDate) continue
      const days = Math.round((new Date(item.expirationDate).getTime() - new Date(today).getTime()) / 86400000)
      if (days < 0 || days > timing) continue
      const key = item.id + '|' + today
      if (existingKeys.has(key)) continue
      const body =
        days === 0
          ? `${item.name} expires today.`
          : days === 1
            ? `${item.name} expires tomorrow.`
            : `${item.name} expires in ${days} days.`
      newNotifs.push({
        id: makeId(),
        title: 'Expiring soon',
        body,
        itemId: item.id,
        createdAt: nowISO(),
        read: false,
      })
    }

    if (newNotifs.length > 0) {
      if (state.settings.notifications.browserPermission === 'granted' && typeof Notification !== 'undefined') {
        for (const n of newNotifs) {
          try {
            new Notification(n.title, { body: n.body, tag: n.itemId })
          } catch {
            // ignore — best-effort browser notification
          }
        }
      }
      set((s) => ({
        notifications: [...newNotifs, ...s.notifications].slice(0, 100),
        lastNotificationScan: today,
      }))
    } else {
      set({ lastNotificationScan: today })
    }
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  },

  markAllNotificationsRead: () => {
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  addStatEvent: async (type, itemName, quantity, categoryId) => {
    const userId = get().userId
    if (!userId) return
    const id = makeId()
    const date = nowISO()
    set((s) => ({ statEvents: [...s.statEvents, { id, type, itemName, categoryId, quantity, date }] }))
    const { error } = await supabase.from('stat_events').insert({
      id,
      user_id: userId,
      type,
      item_name: itemName,
      category_id: categoryId || null,
      quantity,
      occurred_at: date,
    })
    if (error) {
      set((s) => ({ statEvents: removeById(s.statEvents, id) }))
    }
  },

  exportData: () => {
    const state = get()
    return JSON.stringify(
      {
        version: 1,
        exportedAt: nowISO(),
        storageUnits: state.storageUnits,
        categories: state.categories,
        items: state.items,
        shoppingList: state.shoppingList,
        settings: state.settings,
        statEvents: state.statEvents,
      },
      null,
      2,
    )
  },

  importData: async (json) => {
    const userId = get().userId
    if (!userId) return false
    try {
      const parsed = JSON.parse(json) as LegacyBackup
      await importBackupToCloud(userId, parsed, get().categories)
      await get().initializeForUser(userId)
      return true
    } catch {
      notifyError('Could not import that file')
      return false
    }
  },

  resetAllData: async () => {
    const userId = get().userId
    if (!userId) return
    set({ dataStatus: 'loading' })
    try {
      await Promise.all([
        supabase.from('storage_units').delete().eq('user_id', userId),
        supabase.from('shopping_list_items').delete().eq('user_id', userId),
        supabase.from('stat_events').delete().eq('user_id', userId),
        supabase.from('categories').delete().eq('user_id', userId),
      ])
      await supabase.from('categories').insert(
        [
          { name: 'Dairy', icon: 'Milk' },
          { name: 'Meat', icon: 'Beef' },
          { name: 'Fish', icon: 'Fish' },
          { name: 'Vegetables', icon: 'Carrot' },
          { name: 'Fruit', icon: 'Apple' },
          { name: 'Bread', icon: 'Wheat' },
          { name: 'Drinks', icon: 'CupSoda' },
          { name: 'Frozen', icon: 'Snowflake' },
          { name: 'Ready meals', icon: 'UtensilsCrossed' },
          { name: 'Sauces', icon: 'Droplet' },
          { name: 'Snacks', icon: 'Cookie' },
          { name: 'Breakfast', icon: 'Egg' },
          { name: 'Other', icon: 'Package' },
        ].map((c) => ({ ...c, user_id: userId, is_custom: false })),
      )
      await supabase.from('user_settings').upsert(
        {
          user_id: userId,
          theme: 'system',
          onboarding_complete: false,
          user_name: null,
          notifications_enabled: true,
          notifications_timing: '1',
          expiring_soon_days: 3,
        },
        { onConflict: 'user_id' },
      )
      await get().initializeForUser(userId)
    } catch (err) {
      notifyError('Could not reset your data — please try again.')
      set({ dataStatus: 'ready', dataError: err instanceof Error ? err.message : null })
    }
  },
}))
