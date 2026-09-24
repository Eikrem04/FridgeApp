import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChefHat, Plus, Refrigerator, ShoppingCart, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { TopBar } from '../components/layout/TopBar'
import { StorageCard } from '../components/storage/StorageCard'
import { UseSoonRow } from '../components/home/UseSoonRow'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { getExpiredItems, getUseSoonItems } from '../lib/selectors'
import { greetingForTime } from '../lib/date'

export const Home = () => {
  const { t } = useTranslation('home')
  const navigate = useNavigate()
  const storageUnits = useStore((s) => s.storageUnits)
  const items = useStore((s) => s.items)
  const expiringSoonDays = useStore((s) => s.settings.expiration.expiringSoonDays)
  const userName = useStore((s) => s.settings.userName)
  const shoppingCount = useStore((s) => s.shoppingList.filter((i) => !i.purchased).length)

  const useSoon = getUseSoonItems(items, expiringSoonDays, 8)
  const expired = getExpiredItems(items, expiringSoonDays)

  return (
    <div className="pb-28 md:pb-12">
      <TopBar title="" />
      <div className="px-5 md:px-8">
        <div className="mb-1 pt-1">
          <p className="text-[15px] font-medium text-[var(--color-ink-dim)]">{greetingForTime()}{userName ? `, ${userName}` : ''}</p>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-ink)]">{t('title')}</h1>
        </div>

        {(expired.length > 0 || useSoon.length > 0) && (
          <button
            type="button"
            onClick={() => navigate('/inventory?filter=expiring')}
            className="mt-5 flex w-full items-center gap-3.5 rounded-3xl border border-[var(--color-bad)]/15 bg-[var(--color-surface)] p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-bad)] text-white">
              <AlertTriangle size={20} />
            </span>
            <div className="flex-1">
              <p className="text-[15.5px] font-bold text-[var(--color-ink)]">{t('needsAttention')}</p>
              <p className="text-[13.5px] text-[var(--color-ink-dim)]">
                {expired.length > 0 && t('expiredCount', { count: expired.length })}
                {expired.length > 0 && useSoon.length > 0 && ' · '}
                {useSoon.length > 0 && t('expiringSoonCount', { count: useSoon.length })}
              </p>
            </div>
          </button>
        )}

        {storageUnits.length === 0 ? (
          <EmptyState
            icon={<Refrigerator size={26} />}
            title={t('noStorageTitle')}
            subtitle={t('noStorageSubtitle')}
            action={
              <Button icon={<Plus size={16} />} onClick={() => navigate('/settings')}>
                {t('addStorage')}
              </Button>
            }
          />
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {storageUnits.map((unit, i) => (
              <StorageCard key={unit.id} unit={unit} index={i} />
            ))}
          </div>
        )}

        {useSoon.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[var(--color-ink)]">{t('useSoon')}</h2>
              <button
                type="button"
                onClick={() => navigate('/inventory?filter=expiring')}
                className="text-[13.5px] font-semibold text-[var(--color-accent)]"
              >
                {t('seeAll')}
              </button>
            </div>
            <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 md:mx-0 md:px-0">
              {useSoon.map((item, i) => (
                <UseSoonRow key={item.id} item={item} index={i} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-3">
          <QuickTile icon={<ShoppingCart size={20} />} label={t('quickTiles.shopping')} badge={shoppingCount || undefined} onClick={() => navigate('/shopping')} />
          <QuickTile icon={<ChefHat size={20} />} label={t('quickTiles.recipes')} onClick={() => navigate('/recipes')} />
          <QuickTile icon={<TrendingUp size={20} />} label={t('quickTiles.stats')} onClick={() => navigate('/stats')} />
        </div>
      </div>
    </div>
  )
}

const QuickTile = ({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  badge?: number
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="card-surface relative flex flex-col items-center gap-2 rounded-3xl bg-[var(--color-surface)] py-5 transition active:scale-[0.97]"
  >
    {badge !== undefined && (
      <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[11px] font-bold text-white">
        {badge}
      </span>
    )}
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10">
      {icon}
    </span>
    <span className="text-[13px] font-semibold text-[var(--color-ink)]">{label}</span>
  </button>
)
