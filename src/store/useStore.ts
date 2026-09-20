import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
import { DEFAULT_CATEGORIES } from '../data/defaultCategories'
import { makeId } from '../lib/id'
import { nowISO, todayISODate } from '../lib/date'
import { findDuplicateItem } from '../lib/inventory'

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

interface AppState {
  storageUnits: StorageUnit[]
  categories: Category[]
  items: InventoryItem[]
  shoppingList: ShoppingListItem[]
  settings: AppSettings
  statEvents: StatEvent[]
  notifications: InAppNotification[]
  lastNotificationScan: string | null

  // onboarding
  completeOnboarding: (units: { name: string; type: StorageType }[]) => void

  // storage units
  addStorageUnit: (name: string, type: StorageType) => string
  renameStorageUnit: (id: string, name: string) => void
  deleteStorageUnit: (id: string) => void

  // categories
  addCategory: (name: string, icon?: string) => string
  deleteCategory: (id: string) => void

  // items
  addItem: (input: AddItemInput) => { merged: boolean; item: InventoryItem }
  updateItem: (id: string, patch: Partial<InventoryItem>) => void
  changeQuantity: (id: string, delta: number) => InventoryItem | undefined
  deleteItem: (id: string, reason?: StatEventType) => void
  toggleFavorite: (id: string) => void

  // shopping list
  addShoppingItem: (name: string, opts?: { quantity?: number; unit?: string; categoryId?: string }) => void
  removeShoppingItem: (id: string) => void
  togglePurchased: (id: string) => void
  clearPurchased: () => void
  restockShoppingItem: (id: string, storageId: string, categoryId: string) => void

  // settings
  updateSettings: (patch: Partial<AppSettings>) => void
  setTheme: (theme: ThemePreference) => void

  // notifications
  syncNotifications: () => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void

  // stats
  addStatEvent: (type: StatEventType, itemName: string, quantity: number, categoryId?: string) => void

  // data management
  exportData: () => string
  importData: (json: string) => boolean
  resetAllData: () => void
}

const initialPersisted = {
  storageUnits: [] as StorageUnit[],
  categories: DEFAULT_CATEGORIES,
  items: [] as InventoryItem[],
  shoppingList: [] as ShoppingListItem[],
  settings: defaultSettings,
  statEvents: [] as StatEvent[],
  notifications: [] as InAppNotification[],
  lastNotificationScan: null as string | null,
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialPersisted,

      completeOnboarding: (units) => {
        const newUnits: StorageUnit[] = units.map((u) => ({
          id: makeId(),
          name: u.name,
          type: u.type,
          createdAt: nowISO(),
        }))
        set((state) => ({
          storageUnits: [...state.storageUnits, ...newUnits],
          settings: { ...state.settings, onboardingComplete: true },
        }))
      },

      addStorageUnit: (name, type) => {
        const id = makeId()
        set((state) => ({
          storageUnits: [...state.storageUnits, { id, name, type, createdAt: nowISO() }],
        }))
        return id
      },

      renameStorageUnit: (id, name) => {
        set((state) => ({
          storageUnits: state.storageUnits.map((u) => (u.id === id ? { ...u, name } : u)),
        }))
      },

      deleteStorageUnit: (id) => {
        set((state) => ({
          storageUnits: state.storageUnits.filter((u) => u.id !== id),
          items: state.items.filter((it) => it.storageId !== id),
        }))
      },

      addCategory: (name, icon = 'Package') => {
        const id = makeId()
        set((state) => ({
          categories: [...state.categories, { id, name, icon, isCustom: true }],
        }))
        return id
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id || !c.isCustom),
        }))
      },

      addItem: (input) => {
        const state = get()
        const duplicate = findDuplicateItem(state.items, input)
        get().addStatEvent('added', input.name, input.quantity, input.categoryId)
        if (duplicate) {
          const updated: InventoryItem = { ...duplicate, quantity: duplicate.quantity + input.quantity }
          set((s) => ({
            items: s.items.map((it) => (it.id === duplicate.id ? updated : it)),
          }))
          return { merged: true, item: updated }
        }
        const item: InventoryItem = {
          id: makeId(),
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
        return { merged: false, item }
      },

      updateItem: (id, patch) => {
        set((state) => ({
          items: state.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        }))
      },

      changeQuantity: (id, delta) => {
        let updated: InventoryItem | undefined
        let consumedAmount = 0
        set((state) => ({
          items: state.items.map((it) => {
            if (it.id !== id) return it
            const nextQuantity = Math.max(0, it.quantity + delta)
            if (delta < 0) consumedAmount += it.quantity - nextQuantity
            updated = { ...it, quantity: nextQuantity }
            return updated
          }),
        }))
        if (consumedAmount > 0 && updated) {
          get().addStatEvent('consumed', updated.name, consumedAmount, updated.categoryId)
        }
        return updated
      },

      deleteItem: (id, reason = 'consumed') => {
        const item = get().items.find((it) => it.id === id)
        if (item) {
          get().addStatEvent(reason, item.name, item.quantity, item.categoryId)
        }
        set((state) => ({ items: state.items.filter((it) => it.id !== id) }))
      },

      toggleFavorite: (id) => {
        set((state) => ({
          items: state.items.map((it) => (it.id === id ? { ...it, isFavorite: !it.isFavorite } : it)),
        }))
      },

      addShoppingItem: (name, opts) => {
        set((state) => ({
          shoppingList: [
            ...state.shoppingList,
            {
              id: makeId(),
              name,
              quantity: opts?.quantity,
              unit: opts?.unit,
              categoryId: opts?.categoryId,
              purchased: false,
              createdAt: nowISO(),
            },
          ],
        }))
      },

      removeShoppingItem: (id) => {
        set((state) => ({ shoppingList: state.shoppingList.filter((s) => s.id !== id) }))
      },

      togglePurchased: (id) => {
        set((state) => ({
          shoppingList: state.shoppingList.map((s) => (s.id === id ? { ...s, purchased: !s.purchased } : s)),
        }))
      },

      clearPurchased: () => {
        set((state) => ({ shoppingList: state.shoppingList.filter((s) => !s.purchased) }))
      },

      restockShoppingItem: (id, storageId, categoryId) => {
        const shopItem = get().shoppingList.find((s) => s.id === id)
        if (!shopItem) return
        get().addItem({
          name: shopItem.name,
          categoryId: shopItem.categoryId || categoryId,
          quantity: shopItem.quantity || 1,
          unit: shopItem.unit || 'pcs',
          storageId,
          expirationDate: null,
        })
        set((state) => ({ shoppingList: state.shoppingList.filter((s) => s.id !== id) }))
      },

      updateSettings: (patch) => {
        set((state) => ({ settings: { ...state.settings, ...patch } }))
      },

      setTheme: (theme) => {
        set((state) => ({ settings: { ...state.settings, theme } }))
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
          const days = Math.round(
            (new Date(item.expirationDate).getTime() - new Date(today).getTime()) / 86400000,
          )
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
          if (
            state.settings.notifications.browserPermission === 'granted' &&
            typeof Notification !== 'undefined'
          ) {
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

      addStatEvent: (type, itemName, quantity, categoryId) => {
        set((state) => ({
          statEvents: [
            ...state.statEvents,
            { id: makeId(), type, itemName, categoryId, quantity, date: nowISO() },
          ],
        }))
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

      importData: (json) => {
        try {
          const parsed = JSON.parse(json)
          if (!parsed || typeof parsed !== 'object') return false
          set({
            storageUnits: parsed.storageUnits ?? [],
            categories: parsed.categories ?? DEFAULT_CATEGORIES,
            items: parsed.items ?? [],
            shoppingList: parsed.shoppingList ?? [],
            settings: parsed.settings ?? defaultSettings,
            statEvents: parsed.statEvents ?? [],
          })
          return true
        } catch {
          return false
        }
      },

      resetAllData: () => {
        set({ ...initialPersisted, notifications: [], lastNotificationScan: null })
      },
    }),
    {
      name: 'fridgeapp-storage-v1',
    },
  ),
)
