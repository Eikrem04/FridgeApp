import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import { enUS, nb } from 'date-fns/locale'
import i18n from '../i18n'

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

// Read live at call time (not cached), since `i18n.changeLanguage()` can
// happen at any point during the session (Settings → Language) and every
// date-formatting call after that should immediately reflect it.
const dateFnsLocale = () => (i18n.language === 'nb' ? nb : enUS)

export const formatFriendlyDate = (isoDate: string): string => {
  const d = parseISODate(isoDate)
  if (!isValid(d)) return ''
  return format(d, 'd MMM yyyy', { locale: dateFnsLocale() })
}

export const formatShortDate = (isoDate: string): string => {
  const d = parseISODate(isoDate)
  if (!isValid(d)) return ''
  return format(d, 'd MMM', { locale: dateFnsLocale() })
}

export const formatRelativeExpiration = (isoDate: string | null): string => {
  if (!isoDate) return i18n.t('common:dates.noExpiration')
  const days = daysUntil(isoDate)
  if (Number.isNaN(days)) return ''
  if (days < 0) {
    const abs = Math.abs(days)
    return abs === 1 ? i18n.t('common:dates.expiredYesterday') : i18n.t('common:dates.expiredDaysAgo', { count: abs })
  }
  if (days === 0) return i18n.t('common:dates.expiresToday')
  if (days === 1) return i18n.t('common:dates.expiresTomorrow')
  return i18n.t('common:dates.expiresInDays', { count: days })
}

export const formatAddedDate = (iso: string): string => {
  const d = parseISO(iso)
  if (!isValid(d)) return ''
  return format(d, "d MMM yyyy 'at' HH:mm", { locale: dateFnsLocale() })
}

export const greetingForTime = (): string => {
  const h = new Date().getHours()
  if (h < 5) return i18n.t('home:greeting.night')
  if (h < 12) return i18n.t('home:greeting.morning')
  if (h < 18) return i18n.t('home:greeting.afternoon')
  return i18n.t('home:greeting.evening')
}
