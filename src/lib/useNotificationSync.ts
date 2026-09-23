import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { getNotificationPermission } from '../lib/nativeNotifications'

export const useNotificationSync = () => {
  const syncNotifications = useStore((s) => s.syncNotifications)
  const setNotificationPermission = useStore((s) => s.setNotificationPermission)

  useEffect(() => {
    // The store's default `browserPermission` is a synchronous `Notification.permission` read,
    // which doesn't reflect real native (iOS) permission state — checking that is async. This
    // corrects it once on mount; on web this just re-confirms the same synchronous value.
    void getNotificationPermission().then(setNotificationPermission)

    syncNotifications()
    const interval = setInterval(syncNotifications, 1000 * 60 * 30)
    return () => clearInterval(interval)
  }, [syncNotifications, setNotificationPermission])
}
