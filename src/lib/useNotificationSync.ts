import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export const useNotificationSync = () => {
  const syncNotifications = useStore((s) => s.syncNotifications)

  useEffect(() => {
    syncNotifications()
    const interval = setInterval(syncNotifications, 1000 * 60 * 30)
    return () => clearInterval(interval)
  }, [syncNotifications])
}
