import { Bell, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '../ui/Sheet'
import { useStore } from '../../store/useStore'
import { useUiStore } from '../../store/useUiStore'
import { EmptyState } from '../ui/EmptyState'
import { formatAddedDate } from '../../lib/date'

export const NotificationsPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation('settings')
  const notifications = useStore((s) => s.notifications)
  const markRead = useStore((s) => s.markNotificationRead)
  const markAllRead = useStore((s) => s.markAllNotificationsRead)
  const clearAll = useStore((s) => s.clearNotifications)
  const openItem = useUiStore((s) => s.openItem)

  return (
    <Sheet open={open} onClose={onClose} title={t('notificationsPanel.title')}>
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} />}
          title={t('notificationsPanel.emptyTitle')}
          subtitle={t('notificationsPanel.emptySubtitle')}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex justify-end gap-4 pb-1">
            <button type="button" onClick={markAllRead} className="text-[13px] font-semibold text-[var(--color-accent)]">
              {t('notificationsPanel.markAllRead')}
            </button>
            <button type="button" onClick={clearAll} className="flex items-center gap-1 text-[13px] font-semibold text-[var(--color-bad)]">
              <Trash2 size={14} /> {t('notificationsPanel.clear')}
            </button>
          </div>
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                markRead(n.id)
                if (n.itemId) {
                  openItem(n.itemId)
                  onClose()
                }
              }}
              className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-left transition ${
                n.read ? 'bg-transparent' : 'bg-[var(--color-accent-soft)]'
              }`}
            >
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />}
              <span className={n.read ? 'ml-5 flex-1' : 'flex-1'}>
                <span className="block text-[14.5px] font-semibold text-[var(--color-ink)]">{n.title}</span>
                <span className="block text-[13.5px] text-[var(--color-ink-dim)]">{n.body}</span>
                <span className="mt-0.5 block text-xs text-[var(--color-ink-faint)]">{formatAddedDate(n.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  )
}
