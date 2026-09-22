import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes } from 'react-router-dom'
import { useStore } from './store/useStore'
import { useAuthStore } from './store/useAuthStore'
import { isSupabaseConfigured } from './lib/supabase'
import { useThemeSync } from './lib/useThemeSync'
import { useLanguageSync } from './lib/useLanguageSync'
import { useNotificationSync } from './lib/useNotificationSync'
import { getLegacyLocalData, type LegacyBackup } from './lib/migrateLocalData'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { LocalDataMigration } from './components/onboarding/LocalDataMigration'
import { AppShell } from './components/layout/AppShell'
import { ConfigMissingScreen, ErrorScreen, LoadingScreen } from './components/ui/StatusScreens'
import { Auth } from './pages/Auth'
import { ResetPassword } from './pages/ResetPassword'
import { Home } from './pages/Home'
import { Inventory } from './pages/Inventory'
import { StorageDetail } from './pages/StorageDetail'
import { AddItem } from './pages/AddItem'
import { ShoppingList } from './pages/ShoppingList'
import { Recipes } from './pages/Recipes'
import { Stats } from './pages/Stats'
import { Settings } from './pages/Settings'

function App() {
  const { t } = useTranslation('common')
  useThemeSync()
  useLanguageSync()
  useNotificationSync()

  const authStatus = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const isPasswordRecovery = useAuthStore((s) => s.isPasswordRecovery)

  const dataStatus = useStore((s) => s.dataStatus)
  const dataError = useStore((s) => s.dataError)
  const onboardingComplete = useStore((s) => s.settings.onboardingComplete)
  const initializeForUser = useStore((s) => s.initializeForUser)
  const teardown = useStore((s) => s.teardown)

  const [legacyBackup, setLegacyBackup] = useState<LegacyBackup | null | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = useAuthStore.getState().init()
    return unsubscribe
  }, [])

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      void initializeForUser(user.id)
    } else if (authStatus === 'unauthenticated') {
      teardown()
      setLegacyBackup(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user?.id])

  useEffect(() => {
    if (dataStatus === 'ready' && legacyBackup === undefined) {
      setLegacyBackup(getLegacyLocalData())
    }
  }, [dataStatus, legacyBackup])

  if (!isSupabaseConfigured) {
    return <ConfigMissingScreen />
  }

  if (authStatus === 'loading') {
    return <LoadingScreen message={t('loading')} />
  }

  if (authStatus === 'unauthenticated') {
    return <Auth />
  }

  // A recovery-link session grants "authenticated" status, but the user
  // must set a new password before they see the normal app — checked here,
  // before any data loading/onboarding gate below.
  if (isPasswordRecovery) {
    return <ResetPassword />
  }

  if (dataStatus === 'idle' || dataStatus === 'loading') {
    return <LoadingScreen message={t('loadingKitchen')} />
  }

  if (dataStatus === 'error') {
    return <ErrorScreen message={dataError} onRetry={() => user && initializeForUser(user.id)} />
  }

  if (user && legacyBackup) {
    return <LocalDataMigration userId={user.id} backup={legacyBackup} onDone={() => setLegacyBackup(null)} />
  }

  if (!onboardingComplete) {
    return <OnboardingFlow />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/storage/:id" element={<StorageDetail />} />
        <Route path="/add" element={<AddItem />} />
        <Route path="/shopping" element={<ShoppingList />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  )
}

export default App
