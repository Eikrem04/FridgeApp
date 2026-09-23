import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Resets scroll to the top when navigating to a new page. The true scroll container here is the
 * window/document itself — verified directly, not assumed: none of the primary pages (Home,
 * Inventory, ShoppingList, Recipes, Settings, Stats) or the shared AppShell wrapper set any
 * `overflow-y`, so content simply grows the document and the browser's own viewport scrolls it,
 * exactly like BottomNav's sticky positioning already relies on.
 *
 * React Router's client-side navigation never resets window.scrollY on its own (unlike a full
 * page load), so without this, switching bottom-nav tabs — or drilling into any new page — left
 * the next page rendered at whatever scroll position the previous one was left at.
 *
 * Guarded to only fire on a genuine navigation to a different path, and only for PUSH/REPLACE —
 * never on POP (back/forward), which is left untouched so browser/history scroll behavior isn't
 * interfered with. Works identically on native (the Capacitor WebView is a standard web engine;
 * window.scrollTo needs no native-specific handling).
 */
export const useScrollReset = () => {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (navigationType !== 'POP' && pathname !== previousPathname.current) {
      window.scrollTo(0, 0)
    }
    previousPathname.current = pathname
  }, [pathname, navigationType])
}
