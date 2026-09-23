import { Bell, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../store/useStore'
import { HeaderShell } from './HeaderShell'
import { SearchOverlay } from './SearchOverlay'
import { NotificationsPanel } from './NotificationsPanel'

export const TopBar = ({ title }: { title: string }) => {
  const { t } = useTranslation('common')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifications = useStore((s) => s.notifications)
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  return (
    <>
      <HeaderShell
        title={title}
        actions={
          <>
            <button
              type="button"
              aria-label={t('search')}
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] transition active:scale-90 dark:bg-white/10"
            >
              <Search size={19} />
            </button>
            <button
              type="button"
              aria-label={t('notifications')}
              onClick={() => setNotifOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] transition active:scale-90 dark:bg-white/10"
            >
              <Bell size={19} />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-bad)]" />
              )}
            </button>
          </>
        }
      />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  )
}
