import { useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Don't silently refetch more often than this, even if the app is foregrounded
 * and network "online" events both fire in quick succession (e.g. unlocking a
 * phone that reconnects to wifi at the same moment) — one refresh covers both.
 */
const MIN_REFRESH_INTERVAL_MS = 10_000

/**
 * Fixes cross-device data staleness: Supabase Realtime is a live broadcast,
 * not a durable log, so any change made elsewhere while this device's socket
 * was disconnected (tab hidden, device asleep, network dropped) is never
 * delivered once the connection resumes — only new changes going forward
 * are. This refetches the user's data (and resubscribes realtime) whenever:
 *   - the tab/app becomes visible again after being hidden, and
 *   - the browser/device regains network connectivity.
 *
 * Both cases reuse `initializeForUser(userId, { silent: true })` — the exact
 * same fetch-then-resubscribe flow already used for sign-in, reset, and
 * import — rather than a second parallel fetch implementation. `silent`
 * only changes how the UI reacts (no full-screen loading/error flash over
 * data already on screen); the data-loading and realtime-resubscribe logic
 * itself is identical to a normal load, teardownChannel() included, so a
 * stale or disconnected channel is always safely replaced, never doubled up.
 *
 * Once the refresh settles, also re-runs `syncNotifications()` (reusing this same guarded/deduped
 * flow, not a new listener) so a just-deleted item or changed expiration date has its native
 * reminder corrected as soon as the app is foregrounded, rather than waiting for the next 30-
 * minute interval tick in useNotificationSync.ts.
 *
 * Also listens for `@capacitor/app`'s `resume` event, which fires when a
 * native Capacitor app returns to the foreground after being backgrounded —
 * the resume-sync gap is worse there than on the web, since iOS aggressively
 * suspends the WebView (and its socket) rather than just throttling timers.
 * `App.addListener('resume', ...)` is safe to call unconditionally, even in
 * a plain web/PWA build with no native runtime: `@capacitor/app`'s web
 * fallback (verified directly in its source) already listens for
 * `document.visibilitychange` itself and synthesizes a `resume` event when
 * the tab becomes visible, so it never throws or behaves unexpectedly on
 * web — it just means `resume` and the hook's own `visibilitychange`
 * listener can both fire for the same tab-switch. That's fine: both call
 * the exact same guarded `maybeRefresh()`, whose in-flight ref and
 * min-interval throttle already coalesce any overlapping triggers (however
 * many fire, and regardless of source) into at most one actual refresh —
 * no separate dedup logic was needed for this addition.
 */
export const useResumeSync = () => {
  const lastRefreshAt = useRef(0)
  const refreshInFlight = useRef(false)

  useEffect(() => {
    const maybeRefresh = () => {
      const { status, user } = useAuthStore.getState()
      if (status !== 'authenticated' || !user) return
      if (refreshInFlight.current) return

      const now = Date.now()
      if (now - lastRefreshAt.current < MIN_REFRESH_INTERVAL_MS) return
      lastRefreshAt.current = now

      refreshInFlight.current = true
      void useStore
        .getState()
        .initializeForUser(user.id, { silent: true })
        .finally(() => {
          refreshInFlight.current = false
          useStore.getState().syncNotifications()
        })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') maybeRefresh()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', maybeRefresh)
    // addListener is async (it resolves once the native/web listener is actually
    // registered) — the handle is awaited in the cleanup below rather than here,
    // so unmounting before registration finishes still removes it correctly.
    const resumeListener = App.addListener('resume', maybeRefresh)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', maybeRefresh)
      void resumeListener.then((handle) => handle.remove())
    }
  }, [])
}
