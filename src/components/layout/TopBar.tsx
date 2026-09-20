import { Bell, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import { SearchOverlay } from './SearchOverlay'
import { NotificationsPanel } from './NotificationsPanel'

export const TopBar = ({ title }: { title: string }) => {
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifications = useStore((s) => s.notifications)
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  return (
    <>
      <header className="safe-top sticky top-0 z-30 flex items-center justify-between bg-[var(--color-bg)]/85 px-5 pb-3 pt-4 backdrop-blur-xl md:px-8 md:pt-6">
        {title ? (
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--color-ink)]">{title}</h1>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] transition active:scale-90 dark:bg-white/10"
          >
            <Search size={19} />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNotifOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] transition active:scale-90 dark:bg-white/10"
          >
            <Bell size={19} />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-bad)]" />
            )}
          </button>
        </div>
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  )
}
