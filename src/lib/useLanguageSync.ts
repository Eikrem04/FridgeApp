import { useEffect } from 'react'
import i18n, { resolveLanguage } from '../i18n'
import { useStore } from '../store/useStore'

export const useLanguageSync = () => {
  const language = useStore((s) => s.settings.language)

  useEffect(() => {
    const apply = () => {
      const resolved = resolveLanguage(language)
      if (i18n.language !== resolved) void i18n.changeLanguage(resolved)
    }
    apply()

    if (language !== 'system') return undefined
    // Only relevant while following the device/browser locale — re-resolve
    // if the user changes their OS/browser language while the app is open.
    window.addEventListener('languagechange', apply)
    return () => window.removeEventListener('languagechange', apply)
  }, [language])
}
