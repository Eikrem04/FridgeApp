import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'

export const toISODate = (d: Date): string => format(d, 'yyyy-MM-dd')

export const todayISODate = (): string => toISODate(new Date())

export const nowISO = (): string => new Date().toISOString()

export const parseISODate = (s: string): Date => startOfDay(parseISO(s))

export const daysUntil = (isoDate: string): number => {
  const target = parseISODate(isoDate)
  if (!isValid(target)) return NaN
  return differenceInCalendarDays(target, startOfDay(new Date()))
}

export const addDaysISO = (days: number): string => toISODate(addDays(new Date(), days))

export const formatFriendlyDate = (isoDate: string): string => {
  const d = parseISODate(isoDate)
  if (!isValid(d)) return ''
  return format(d, 'd MMM yyyy')
}

export const formatShortDate = (isoDate: string): string => {
  const d = parseISODate(isoDate)
  if (!isValid(d)) return ''
  return format(d, 'd MMM')
}

export const formatRelativeExpiration = (isoDate: string | null): string => {
  if (!isoDate) return 'No expiration'
  const days = daysUntil(isoDate)
  if (Number.isNaN(days)) return ''
  if (days < 0) {
    const abs = Math.abs(days)
    return abs === 1 ? 'Expired yesterday' : `Expired ${abs} days ago`
  }
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

export const formatAddedDate = (iso: string): string => {
  const d = parseISO(iso)
  if (!isValid(d)) return ''
  return format(d, "d MMM yyyy 'at' HH:mm")
}

export const greetingForTime = (): string => {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
