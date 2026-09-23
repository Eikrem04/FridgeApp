import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useStore } from '../store/useStore'

export const useThemeSync = () => {
  const theme = useStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement
    const apply = (dark: boolean) => {
      root.classList.toggle('dark', dark)
      root.dataset.theme = dark ? 'dark' : 'light'
      // Style.Dark = light status bar text (for our dark background), Style.Light = dark text
      // (for our light background) — this naming, verified directly in the plugin's own type
      // defs, is the opposite of what it sounds like. No-op on web (the plugin has no web
      // implementation and rejects there), hence the native guard.
      if (Capacitor.isNativePlatform()) {
        void StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {})
      }
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches)
      const listener = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }

    apply(theme === 'dark')
    return undefined
  }, [theme])
}
