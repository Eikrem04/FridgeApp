import type { InventoryItem, StatEvent } from '../types'

export const findDuplicateItem = (
  items: InventoryItem[],
  candidate: Pick<InventoryItem, 'name' | 'storageId' | 'expirationDate' | 'categoryId'>,
): InventoryItem | undefined => {
  const name = candidate.name.trim().toLowerCase()
  return items.find(
    (it) =>
      it.name.trim().toLowerCase() === name &&
      it.storageId === candidate.storageId &&
      it.categoryId === candidate.categoryId &&
      (it.expirationDate ?? null) === (candidate.expirationDate ?? null),
  )
}

export interface FrequentEntry {
  name: string
  categoryId?: string
  unit?: string
  quantity?: number
  storageId?: string
  count: number
}

/**
 * Ranks items by how often they've been added. `stat_events` only ever recorded
 * `itemName`/`categoryId`/`quantity` — there's no `unit` or `storageId` column on
 * that table — so `quantity` and `categoryId` come from the most recent "added"
 * event (a real, reliable historical signal: exactly what was typed in the Add
 * form last time). `unit` and `storageId` are enriched, best-effort, from a
 * currently-held item with the same name when one exists; there is deliberately
 * no fallback for those two fields, since a guess would be worse than leaving
 * the form's own default in place. Expiration is never touched here — that's
 * intentional, it's decided by the caller for every purchase.
 */
export const getFrequentItems = (
  events: StatEvent[],
  currentItems: InventoryItem[],
  limit = 8,
): FrequentEntry[] => {
  const addedEvents = [...events]
    .filter((e) => e.type === 'added')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const map = new Map<string, FrequentEntry>()
  for (const e of addedEvents) {
    const key = e.itemName.trim().toLowerCase()
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
      existing.name = e.itemName
      existing.categoryId = e.categoryId ?? existing.categoryId
      existing.quantity = e.quantity
    } else {
      map.set(key, { name: e.itemName, categoryId: e.categoryId, quantity: e.quantity, count: 1 })
    }
  }

  for (const item of currentItems) {
    const entry = map.get(item.name.trim().toLowerCase())
    if (entry) {
      entry.unit = item.unit
      entry.storageId = item.storageId
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
