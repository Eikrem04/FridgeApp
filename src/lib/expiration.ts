import type { ExpirationStatus, InventoryItem } from '../types'
import { daysUntil } from './date'

export const getExpirationStatus = (
  item: Pick<InventoryItem, 'expirationDate'>,
  expiringSoonDays: number,
): ExpirationStatus => {
  if (!item.expirationDate) return 'none'
  const days = daysUntil(item.expirationDate)
  if (Number.isNaN(days)) return 'none'
  if (days < 0) return 'expired'
  if (days === 0) return 'expiresToday'
  if (days <= expiringSoonDays) return 'expiringSoon'
  return 'fresh'
}

export const statusOrder: Record<ExpirationStatus, number> = {
  expired: 0,
  expiresToday: 1,
  expiringSoon: 2,
  fresh: 3,
  none: 4,
}

export const statusColors: Record<
  ExpirationStatus,
  { text: string; bg: string; dot: string; label: string }
> = {
  expired: { text: 'text-[var(--color-bad)]', bg: 'bg-[var(--color-bad-soft)]', dot: 'bg-[var(--color-bad)]', label: 'Expired' },
  expiresToday: { text: 'text-[var(--color-warn)]', bg: 'bg-[var(--color-warn-soft)]', dot: 'bg-[var(--color-warn)]', label: 'Expires today' },
  expiringSoon: { text: 'text-[var(--color-warn)]', bg: 'bg-[var(--color-warn-soft)]', dot: 'bg-[var(--color-warn)]', label: 'Expiring soon' },
  fresh: { text: 'text-[var(--color-good)]', bg: 'bg-[var(--color-good-soft)]', dot: 'bg-[var(--color-good)]', label: 'Fresh' },
  none: { text: 'text-[var(--color-ink-faint)]', bg: 'bg-black/5', dot: 'bg-[var(--color-ink-faint)]', label: 'No date' },
}
