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
  count: number
}

export const getFrequentItems = (events: StatEvent[], limit = 8): FrequentEntry[] => {
  const map = new Map<string, FrequentEntry>()
  for (const e of events) {
    if (e.type !== 'added') continue
    const key = e.itemName.trim().toLowerCase()
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
    } else {
      map.set(key, { name: e.itemName, categoryId: e.categoryId, count: 1 })
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
