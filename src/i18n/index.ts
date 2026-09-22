import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { LanguagePreference } from '../types'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enOnboarding from './locales/en/onboarding.json'
import enHome from './locales/en/home.json'
import enInventory from './locales/en/inventory.json'
import enAddItem from './locales/en/addItem.json'
import enShopping from './locales/en/shopping.json'
import enRecipes from './locales/en/recipes.json'
import enStats from './locales/en/stats.json'
import enSettings from './locales/en/settings.json'

import nbCommon from './locales/nb/common.json'
import nbAuth from './locales/nb/auth.json'
import nbOnboarding from './locales/nb/onboarding.json'
import nbHome from './locales/nb/home.json'
import nbInventory from './locales/nb/inventory.json'
import nbAddItem from './locales/nb/addItem.json'
import nbShopping from './locales/nb/shopping.json'
import nbRecipes from './locales/nb/recipes.json'
import nbStats from './locales/nb/stats.json'
import nbSettings from './locales/nb/settings.json'

export type AppLanguage = 'en' | 'nb'

/**
 * "System default" resolution — per spec: browser/device language starting
 * with `nb` or `no` (Bokmål or the generic Norwegian macro-tag) resolves to
 * Norwegian, everything else falls back to English. Reads `navigator.language`
 * / `navigator.languages`, which reflect the OS/browser locale in both a
 * normal browser tab and a Capacitor WebView, so this holds up unchanged
 * once the app is wrapped natively — no platform-specific branch needed.
 */
export const resolveSystemLanguage = (): AppLanguage => {
  const candidates =
    typeof navigator !== 'undefined' ? navigator.languages?.length ? navigator.languages : [navigator.language] : []
  const primary = (candidates[0] || 'en').toLowerCase()
  return primary.startsWith('nb') || primary.startsWith('no') ? 'nb' : 'en'
}

export const resolveLanguage = (preference: LanguagePreference): AppLanguage =>
  preference === 'system' ? resolveSystemLanguage() : preference

export const NAMESPACES = [
  'common',
  'auth',
  'onboarding',
  'home',
  'inventory',
  'addItem',
  'shopping',
  'recipes',
  'stats',
  'settings',
] as const

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      onboarding: enOnboarding,
      home: enHome,
      inventory: enInventory,
      addItem: enAddItem,
      shopping: enShopping,
      recipes: enRecipes,
      stats: enStats,
      settings: enSettings,
    },
    nb: {
      common: nbCommon,
      auth: nbAuth,
      onboarding: nbOnboarding,
      home: nbHome,
      inventory: nbInventory,
      addItem: nbAddItem,
      shopping: nbShopping,
      recipes: nbRecipes,
      stats: nbStats,
      settings: nbSettings,
    },
  },
  lng: resolveSystemLanguage(),
  fallbackLng: 'en',
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
