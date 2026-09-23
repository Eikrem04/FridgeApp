import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Listens for `@capacitor/app`'s `appUrlOpen` event — fired when Kitch is opened via its
 * `kitch://` custom URL scheme, whether the app was already running or was launched by the link
 * itself (both cases are delivered through this one event; see AppDelegate/SceneDelegate, which
 * already forward `openURLContexts` without any change needed here). Used for the native
 * password-reset deep link (see requestPasswordReset/handleAuthDeepLink in useAuthStore.ts).
 *
 * Safe to register unconditionally on web/PWA too: `@capacitor/app`'s web fallback (verified
 * directly in its source, same as the `resume` event used by useResumeSync.ts) never emits
 * `appUrlOpen` itself, so this is simply inert there — matching the existing web/PWA behavior,
 * which still handles password reset via the web origin redirect and detectSessionInUrl.
 */
export const useDeepLinkAuth = () => {
  useEffect(() => {
    const handleAuthDeepLink = useAuthStore.getState().handleAuthDeepLink
    const listener = App.addListener('appUrlOpen', ({ url }) => {
      void handleAuthDeepLink(url)
    })

    return () => {
      void listener.then((handle) => handle.remove())
    }
  }, [])
}
