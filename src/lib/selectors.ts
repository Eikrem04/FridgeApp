import type { InventoryItem } from '../types'
import { getExpirationStatus } from './expiration'
import { daysUntil } from './date'

export const sortByExpirationAsc = (items: InventoryItem[]): InventoryItem[] => {
  return [...items].sort((a, b) => {
    if (!a.expirationDate && !b.expirationDate) return 0
    if (!a.expirationDate) return 1
    if (!b.expirationDate) return -1
    return daysUntil(a.expirationDate) - daysUntil(b.expirationDate)
  })
}

export const getUseSoonItems = (items: InventoryItem[], expiringSoonDays: number, limit = 5): InventoryItem[] => {
  const relevant = items.filter((it) => {
    const status = getExpirationStatus(it, expiringSoonDays)
    return status === 'expiringSoon' || status === 'expiresToday'
  })
  return sortByExpirationAsc(relevant).slice(0, limit)
}

export const getExpiredItems = (items: InventoryItem[], expiringSoonDays: number): InventoryItem[] => {
  return items.filter((it) => getExpirationStatus(it, expiringSoonDays) === 'expired')
}

export type SortMode = 'expiration' | 'name' | 'recent' | 'quantity' | 'category'

export const sortItems = (items: InventoryItem[], mode: SortMode): InventoryItem[] => {
  const arr = [...items]
  switch (mode) {
    case 'name':
      return arr.sort((a, b) => a.name.localeCompare(b.name))
    case 'recent':
      return arr.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    case 'quantity':
      return arr.sort((a, b) => b.quantity - a.quantity)
    case 'category':
      return arr.sort((a, b) => a.categoryId.localeCompare(b.categoryId))
    case 'expiration':
    default:
      return sortByExpirationAsc(arr)
  }
}
