import { Route, Routes } from 'react-router-dom'
import { useStore } from './store/useStore'
import { useThemeSync } from './lib/useThemeSync'
import { useNotificationSync } from './lib/useNotificationSync'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { AppShell } from './components/layout/AppShell'
import { Home } from './pages/Home'
import { Inventory } from './pages/Inventory'
import { StorageDetail } from './pages/StorageDetail'
import { AddItem } from './pages/AddItem'
import { ShoppingList } from './pages/ShoppingList'
import { Recipes } from './pages/Recipes'
import { Stats } from './pages/Stats'
import { Settings } from './pages/Settings'

function App() {
  useThemeSync()
  useNotificationSync()
  const onboardingComplete = useStore((s) => s.settings.onboardingComplete)

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
