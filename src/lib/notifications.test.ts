import { describe, expect, it } from 'vitest'
import { computeExpiringSchedule, notificationId, selectPrimaryReminders } from './notifications'

const NOW = new Date('2024-06-10T08:00:00')

describe('computeExpiringSchedule', () => {
  it('schedules one entry per day-offset from 0 through timingDays', () => {
    const entries = computeExpiringSchedule([{ id: 'a', name: 'Milk', expirationDate: '2024-06-13' }], 3, NOW)
    expect(entries.map((e) => e.daysBeforeExpiry).sort()).toEqual([0, 1, 2, 3])
    expect(entries.every((e) => e.itemId === 'a' && e.itemName === 'Milk')).toBe(true)
  })

  it('skips items with no expiration date', () => {
    expect(computeExpiringSchedule([{ id: 'a', name: 'Milk', expirationDate: null }], 3, NOW)).toEqual([])
  })

  it('never schedules a reminder in the past', () => {
    // Expires tomorrow, with a 3-day window — day-offsets 2 and 3 would fall before NOW and must be dropped.
    const entries = computeExpiringSchedule([{ id: 'a', name: 'Milk', expirationDate: '2024-06-11' }], 3, NOW)
    expect(entries.map((e) => e.daysBeforeExpiry).sort()).toEqual([0, 1])
  })

  it('drops every entry for an item that already expired', () => {
    const entries = computeExpiringSchedule([{ id: 'a', name: 'Milk', expirationDate: '2024-06-01' }], 3, NOW)
    expect(entries).toEqual([])
  })

  it('fires at 09:00 local time on the correct calendar day', () => {
    const [entry] = computeExpiringSchedule([{ id: 'a', name: 'Milk', expirationDate: '2024-06-13' }], 0, NOW)
    expect(entry.fireAt.getHours()).toBe(9)
    expect(entry.fireAt.getDate()).toBe(13)
  })

  it('handles multiple items independently', () => {
    const entries = computeExpiringSchedule(
      [
        { id: 'a', name: 'Milk', expirationDate: '2024-06-13' },
        { id: 'b', name: 'Eggs', expirationDate: '2024-06-20' },
      ],
      1,
      NOW,
    )
    expect(entries.filter((e) => e.itemId === 'a')).toHaveLength(2)
    expect(entries.filter((e) => e.itemId === 'b')).toHaveLength(2)
  })
})

describe('selectPrimaryReminders', () => {
  it('keeps only the earliest-firing entry per item', () => {
    const entries = computeExpiringSchedule(
      [
        { id: 'a', name: 'Milk', expirationDate: '2024-06-13' },
        { id: 'b', name: 'Eggs', expirationDate: '2024-06-20' },
      ],
      3,
      NOW,
    )
    const primary = selectPrimaryReminders(entries)
    expect(primary).toHaveLength(2)

    const forA = primary.find((e) => e.itemId === 'a')!
    const forB = primary.find((e) => e.itemId === 'b')!
    expect(forA.fireAt.getTime()).toBe(Math.min(...entries.filter((e) => e.itemId === 'a').map((e) => e.fireAt.getTime())))
    expect(forB.fireAt.getTime()).toBe(Math.min(...entries.filter((e) => e.itemId === 'b').map((e) => e.fireAt.getTime())))
  })

  it('returns one entry per distinct item id, order-independent', () => {
    const entries = computeExpiringSchedule([{ id: 'a', name: 'Milk', expirationDate: '2024-06-13' }], 3, NOW)
    const shuffled = [...entries].reverse()
    expect(selectPrimaryReminders(shuffled)).toHaveLength(1)
  })

  it('returns an empty array for no entries', () => {
    expect(selectPrimaryReminders([])).toEqual([])
  })
})

describe('notificationId', () => {
  it('is deterministic for the same item and day-offset', () => {
    expect(notificationId('item-1', 2)).toBe(notificationId('item-1', 2))
  })

  it('differs between day-offsets for the same item', () => {
    expect(notificationId('item-1', 0)).not.toBe(notificationId('item-1', 1))
  })

  it('differs between different items at the same day-offset', () => {
    expect(notificationId('item-1', 0)).not.toBe(notificationId('item-2', 0))
  })

  it('always produces a value within the 32-bit signed integer range', () => {
    for (const id of ['a', 'zzzzzzzzzzzzzzzzzzzz', 'inventory-item-uuid-1234']) {
      for (let day = 0; day <= 3; day++) {
        const value = notificationId(id, day)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(2147483647)
      }
    }
  })
})
