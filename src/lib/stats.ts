import { isSameMonth, parseISO } from 'date-fns'
import type { StatEvent } from '../types'

export interface MonthStats {
  added: number
  consumed: number
  expired: number
  discarded: number
  wastePercent: number
}

export const getMonthStats = (events: StatEvent[], reference = new Date()): MonthStats => {
  const monthEvents = events.filter((e) => isSameMonth(parseISO(e.date), reference))
  const sum = (type: StatEvent['type']) => monthEvents.filter((e) => e.type === type).reduce((acc, e) => acc + e.quantity, 0)

  const added = sum('added')
  const consumed = sum('consumed')
  const expired = sum('expired')
  const discarded = sum('discarded')
  const removed = consumed + expired + discarded
  const waste = expired + discarded
  const wastePercent = removed > 0 ? Math.round((waste / removed) * 100) : 0

  return { added, consumed, expired, discarded, wastePercent }
}

export const getCategoryBreakdown = (
  events: StatEvent[],
  reference = new Date(),
): { categoryId: string; count: number }[] => {
  const monthEvents = events.filter((e) => isSameMonth(parseISO(e.date), reference) && e.type === 'added')
  const map = new Map<string, number>()
  for (const e of monthEvents) {
    const key = e.categoryId ?? 'other'
    map.set(key, (map.get(key) ?? 0) + e.quantity)
  }
  return Array.from(map.entries())
    .map(([categoryId, count]) => ({ categoryId, count }))
    .sort((a, b) => b.count - a.count)
}
