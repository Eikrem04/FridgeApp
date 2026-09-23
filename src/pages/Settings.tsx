import { useState } from 'react'
import { Bell, Info, AlarmClock, ChefHat, LogOut, Mail, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { TopBar } from '../components/layout/TopBar'
import { SettingsSection, SettingsRow } from '../components/settings/SettingsSection'
import { StorageUnitsSection } from '../components/settings/StorageUnitsSection'
import { CategoriesSection } from '../components/settings/CategoriesSection'
import { DataSection } from '../components/settings/DataSection'
import { DeleteAccountSheet } from '../components/settings/DeleteAccountSheet'
import { RecipePreferencesSheet } from '../components/settings/RecipePreferencesSheet'
import { Segmented } from '../components/ui/Segmented'
import { Stepper } from '../components/ui/Stepper'
import type { LanguagePreference, NotificationTiming, ThemePreference } from '../types'

export const Settings = () => {
  const { t } = useTranslation(['settings', 'common', 'recipes'])
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const setTheme = useStore((s) => s.setTheme)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [recipePrefsOpen, setRecipePrefsOpen] = useState(false)

  const TIMING_OPTIONS: { value: string; label: string }[] = [
    { value: '3', label: t('notifications.timing3') },
    { value: '2', label: t('notifications.timing2') },
    { value: '1', label: t('notifications.timing1') },
    { value: 'never', label: t('notifications.timingNever') },
  ]

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    updateSettings({ notifications: { ...settings.notifications, browserPermission: permission, enabled: permission === 'granted' } })
  }

  return (
    <div className="pb-28 md:pb-12">
      <TopBar title={t('title')} />
      <div className="px-5 md:px-8">
        <SettingsSection title={t('account.title')}>
          <SettingsRow icon={<Mail size={16} />} label={user?.email ?? t('account.signedIn')} sub={t('account.synced')} />
          <SettingsRow icon={<LogOut size={16} />} label={t('account.logOut')} tone="accent" onClick={() => void signOut()} />
          <SettingsRow
            icon={<Trash2 size={16} />}
            label={t('account.deleteAccount')}
            tone="danger"
            onClick={() => setDeleteAccountOpen(true)}
          />
        </SettingsSection>

        <StorageUnitsSection />

        <SettingsSection title={t('appearance.title')}>
          <div className="p-4">
            <Segmented<ThemePreference>
              options={[
                { value: 'light', label: t('appearance.light') },
                { value: 'dark', label: t('appearance.dark') },
                { value: 'system', label: t('appearance.system') },
              ]}
              value={settings.theme}
              onChange={setTheme}
            />
          </div>
        </SettingsSection>

        <SettingsSection title={t('language.title')}>
          <div className="p-4">
            <Segmented<LanguagePreference>
              options={[
                { value: 'system', label: t('language.system') },
                { value: 'en', label: t('language.english') },
                { value: 'nb', label: t('language.norwegian') },
              ]}
              value={settings.language}
              onChange={(language) => updateSettings({ language })}
            />
          </div>
        </SettingsSection>

        <SettingsSection title={t('recipes:preferences.title')}>
          <SettingsRow
            icon={<ChefHat size={16} />}
            label={t('recipes:preferences.title')}
            sub={t('recipes:preferences.settingsSub')}
            onClick={() => setRecipePrefsOpen(true)}
          />
        </SettingsSection>

        <SettingsSection title={t('notifications.title')}>
          <SettingsRow
            icon={<Bell size={16} />}
            label={t('notifications.enabled')}
            sub={
              settings.notifications.browserPermission === 'granted'
                ? t('notifications.granted')
                : settings.notifications.browserPermission === 'denied'
                  ? t('notifications.denied')
                  : t('notifications.inAppOnly')
            }
            right={
              <button
                type="button"
                role="switch"
                aria-checked={settings.notifications.enabled}
                aria-label={t('notifications.enabled')}
                onClick={() => updateSettings({ notifications: { ...settings.notifications, enabled: !settings.notifications.enabled } })}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  settings.notifications.enabled ? 'bg-[var(--color-good)]' : 'bg-black/15 dark:bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    settings.notifications.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            }
          />
          {settings.notifications.browserPermission !== 'granted' && settings.notifications.browserPermission !== 'unsupported' && (
            <SettingsRow
              icon={<AlarmClock size={16} />}
              label={t('notifications.allowAlerts')}
              sub={t('notifications.allowAlertsSubtitle')}
              onClick={requestNotificationPermission}
            />
          )}
          <div className="p-4">
            <p className="mb-2 text-[13px] font-medium text-[var(--color-ink-dim)]">{t('notifications.notifyMe')}</p>
            <div className="flex flex-col gap-1">
              {TIMING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    updateSettings({
                      notifications: {
                        ...settings.notifications,
                        timing: (opt.value === 'never' ? 'never' : Number(opt.value)) as NotificationTiming,
                      },
                    })
                  }
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition ${
                    String(settings.notifications.timing) === opt.value ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
                  }`}
                >
                  {opt.label}
                  {String(settings.notifications.timing) === opt.value && <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />}
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title={t('expiration.title')}>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-[15px] font-medium text-[var(--color-ink)]">{t('expiration.windowTitle')}</p>
              <p className="text-[12.5px] text-[var(--color-ink-faint)]">{t('expiration.windowSubtitle')}</p>
            </div>
            <Stepper
              value={settings.expiration.expiringSoonDays}
              onChange={(v) => updateSettings({ expiration: { expiringSoonDays: v } })}
              min={1}
              max={14}
              size="sm"
            />
          </div>
        </SettingsSection>

        <CategoriesSection />
        <DataSection />

        <SettingsSection title={t('about.title')}>
          <SettingsRow icon={<Info size={16} />} label={t('about.appName')} sub={t('about.version')} />
        </SettingsSection>
      </div>

      <DeleteAccountSheet open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} />
      <RecipePreferencesSheet open={recipePrefsOpen} onClose={() => setRecipePrefsOpen(false)} />
    </div>
  )
}
