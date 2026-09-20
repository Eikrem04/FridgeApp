import { Bell, Info, AlarmClock } from 'lucide-react'
import { useStore } from '../store/useStore'
import { TopBar } from '../components/layout/TopBar'
import { SettingsSection, SettingsRow } from '../components/settings/SettingsSection'
import { StorageUnitsSection } from '../components/settings/StorageUnitsSection'
import { CategoriesSection } from '../components/settings/CategoriesSection'
import { DataSection } from '../components/settings/DataSection'
import { Segmented } from '../components/ui/Segmented'
import { Stepper } from '../components/ui/Stepper'
import type { NotificationTiming, ThemePreference } from '../types'

const TIMING_OPTIONS: { value: string; label: string }[] = [
  { value: '3', label: '3 days before' },
  { value: '2', label: '2 days before' },
  { value: '1', label: '1 day before' },
  { value: 'never', label: 'Never' },
]

export const Settings = () => {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const setTheme = useStore((s) => s.setTheme)

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    updateSettings({ notifications: { ...settings.notifications, browserPermission: permission, enabled: permission === 'granted' } })
  }

  return (
    <div className="pb-28 md:pb-12">
      <TopBar title="Settings" />
      <div className="px-5 md:px-8">
        <StorageUnitsSection />

        <SettingsSection title="Appearance">
          <div className="p-4">
            <Segmented<ThemePreference>
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
              value={settings.theme}
              onChange={setTheme}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow
            icon={<Bell size={16} />}
            label="Enabled"
            sub={
              settings.notifications.browserPermission === 'granted'
                ? 'Browser notifications allowed'
                : settings.notifications.browserPermission === 'denied'
                  ? 'Blocked in browser settings'
                  : 'In-app alerts always on'
            }
            right={
              <button
                type="button"
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
              label="Allow browser alerts"
              sub="Get a native notification when the app is open"
              onClick={requestNotificationPermission}
            />
          )}
          <div className="p-4">
            <p className="mb-2 text-[13px] font-medium text-[var(--color-ink-dim)]">Notify me</p>
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

        <SettingsSection title="Expiration">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-[15px] font-medium text-[var(--color-ink)]">"Expiring soon" window</p>
              <p className="text-[12.5px] text-[var(--color-ink-faint)]">Days before expiration to start warning</p>
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

        <SettingsSection title="About">
          <SettingsRow icon={<Info size={16} />} label="Kitchen" sub="Version 1.0.0" />
        </SettingsSection>
      </div>
    </div>
  )
}
