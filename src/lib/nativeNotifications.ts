import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type PermissionStatus } from '@capacitor/local-notifications'
import i18n from '../i18n'
import { notificationId, selectPrimaryReminders, type ExpiringEntry } from './notifications'

/** iOS caps an app at 64 pending local notifications; this stays comfortably under that. */
const MAX_NATIVE_NOTIFICATIONS = 60

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform()

/** Unified permission shape across both delivery mechanisms, matching the Web Notification API's own type. */
export type AppNotificationPermission = NotificationPermission | 'unsupported'

const mapNativePermission = (status: PermissionStatus): AppNotificationPermission => {
  if (status.display === 'granted') return 'granted'
  if (status.display === 'denied') return 'denied'
  return 'default' // 'prompt' / 'prompt-with-rationale' — user hasn't decided yet, same as the web API's 'default'
}

/** Reads current notification permission without prompting — safe to call anytime, including on mount. */
export const getNotificationPermission = async (): Promise<AppNotificationPermission> => {
  if (isNativePlatform()) return mapNativePermission(await LocalNotifications.checkPermissions())
  return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
}

/** Prompts the user — only ever call this from an explicit user action (e.g. tapping "Allow alerts" in Settings), never on launch. */
export const requestAppNotificationPermission = async (): Promise<AppNotificationPermission> => {
  if (isNativePlatform()) return mapNativePermission(await LocalNotifications.requestPermissions())
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.requestPermission()
}

const bodyForDays = (name: string, days: number): string =>
  days === 0
    ? i18n.t('settings:notificationsPanel.expiresToday', { name })
    : days === 1
      ? i18n.t('settings:notificationsPanel.expiresTomorrow', { name })
      : i18n.t('settings:notificationsPanel.expiresInDays', { name, days })

/**
 * Replaces every native local notification Kitchen has scheduled with a fresh set built from
 * `entries`. Always cancels whatever is currently pending first, then schedules from scratch —
 * this makes repeated calls naturally idempotent (never a duplicate, regardless of how often or
 * how close together this runs) and is what keeps the native schedule in sync with inventory
 * changes, without needing to hook into every individual add/edit/delete call site — see
 * syncNotifications in useStore.ts for where and how often this gets called.
 *
 * No-op on web (the web path fires an immediate `Notification` instead — see useStore.ts) and
 * no-op if permission isn't granted, so a denied/undecided permission degrades silently to
 * in-app-only, exactly like the existing web behavior.
 *
 * Schedules at most one native reminder per item (see selectPrimaryReminders) — the in-app list
 * is unaffected and still shows every qualifying day — and, as a defensive backstop against iOS's
 * 64-pending-notification cap, schedules only the MAX_NATIVE_NOTIFICATIONS soonest-expiring ones,
 * logging a warning if any had to be skipped.
 */
export const rescheduleNativeNotifications = async (entries: ExpiringEntry[]): Promise<void> => {
  if (!isNativePlatform()) return

  const permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') return

  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
  }
  if (entries.length === 0) return

  const sorted = selectPrimaryReminders(entries).sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
  const toSchedule = sorted.slice(0, MAX_NATIVE_NOTIFICATIONS)
  if (sorted.length > MAX_NATIVE_NOTIFICATIONS) {
    console.warn(
      `[Kitchen] Skipping ${sorted.length - MAX_NATIVE_NOTIFICATIONS} native notification(s) beyond the ${MAX_NATIVE_NOTIFICATIONS}-notification cap`,
    )
  }
  if (toSchedule.length === 0) return

  const title = i18n.t('settings:notificationsPanel.expiringSoonTitle')
  await LocalNotifications.schedule({
    notifications: toSchedule.map((entry) => ({
      id: notificationId(entry.itemId, entry.daysBeforeExpiry),
      title,
      body: bodyForDays(entry.itemName, entry.daysBeforeExpiry),
      schedule: { at: entry.fireAt },
    })),
  })
}
