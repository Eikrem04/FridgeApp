import type { InventoryItem } from '../types'

/** Local hour (24h, device time) scheduled expiry reminders fire at. */
const REMINDER_HOUR = 9

export interface ExpiringEntry {
  itemId: string
  itemName: string
  /** 0 = fires the day the item expires, 1 = the day before, etc. — mirrors the existing `timing` setting. */
  daysBeforeExpiry: number
  /** The exact moment (device local time) this reminder should fire. Always in the future. */
  fireAt: Date
}

/**
 * Pure scheduling logic shared by native local notifications — kept separate from any
 * Capacitor/DOM API so it's trivially unit-testable. For every item with an expiration date,
 * computes one entry per day-offset from 0 (expires today) through `timingDays` (the existing
 * "notify me starting N days before expiration" setting), skipping any that would fire in the
 * past. This intentionally covers the item's FULL upcoming reminder window in one pass — unlike
 * the existing in-app/web-Notification path, which only ever looks at "is this item within the
 * window today" (see syncNotifications in useStore.ts) — because native notifications must be
 * scheduled ahead of time to fire while the app isn't open, whereas the web path only needs to
 * decide what to show right now, while the app is open and running the scan.
 */
export const computeExpiringSchedule = (
  items: Pick<InventoryItem, 'id' | 'name' | 'expirationDate'>[],
  timingDays: number,
  now: Date = new Date(),
): ExpiringEntry[] => {
  const entries: ExpiringEntry[] = []
  for (const item of items) {
    if (!item.expirationDate) continue
    const expiry = new Date(`${item.expirationDate}T00:00:00`)
    if (Number.isNaN(expiry.getTime())) continue

    for (let daysBeforeExpiry = 0; daysBeforeExpiry <= timingDays; daysBeforeExpiry++) {
      const fireAt = new Date(expiry)
      fireAt.setDate(fireAt.getDate() - daysBeforeExpiry)
      fireAt.setHours(REMINDER_HOUR, 0, 0, 0)
      if (fireAt.getTime() <= now.getTime()) continue
      entries.push({ itemId: item.id, itemName: item.name, daysBeforeExpiry, fireAt })
    }
  }
  return entries
}

/**
 * Native local notifications get exactly one reminder per item (unlike the in-app list, which is
 * unaffected and keeps showing every qualifying day — see syncNotifications in useStore.ts). Of
 * an item's computed entries, this keeps the one with the earliest `fireAt`: the soonest reminder
 * that will still fire in the future, i.e. the most upcoming — and therefore most relevant — one
 * within the configured window, giving the user the most advance notice a single native alert can.
 */
export const selectPrimaryReminders = (entries: ExpiringEntry[]): ExpiringEntry[] => {
  const earliestByItem = new Map<string, ExpiringEntry>()
  for (const entry of entries) {
    const current = earliestByItem.get(entry.itemId)
    if (!current || entry.fireAt.getTime() < current.fireAt.getTime()) {
      earliestByItem.set(entry.itemId, entry)
    }
  }
  return [...earliestByItem.values()]
}

/**
 * Deterministic 32-bit notification id from an item id + day-offset, so re-scheduling the same
 * reminder always produces the same id — not that it matters much given
 * rescheduleNativeNotifications always cancels everything pending before scheduling fresh
 * (see nativeNotifications.ts), but it keeps ids stable and collision-free per item/day-offset.
 */
export const notificationId = (itemId: string, daysBeforeExpiry: number): number => {
  let hash = 0
  for (let i = 0; i < itemId.length; i++) hash = (hash * 31 + itemId.charCodeAt(i)) | 0
  return (Math.abs(hash) % 1_000_000) * 16 + daysBeforeExpiry
}
