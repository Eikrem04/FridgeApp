import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { TopBar } from '../components/layout/TopBar'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { getCategoryBreakdown, getMonthStats } from '../lib/stats'
import { getCategoryDisplayName } from '../lib/categoryLocalization'
import { CategoryIcon } from '../lib/icons'

export const Stats = () => {
  const { t, i18n } = useTranslation('stats')
  const statEvents = useStore((s) => s.statEvents)
  const categories = useStore((s) => s.categories)
  const monthStats = useMemo(() => getMonthStats(statEvents), [statEvents])
  const breakdown = useMemo(() => getCategoryBreakdown(statEvents), [statEvents])
  const monthLabel = new Date().toLocaleDateString(i18n.language === 'nb' ? 'nb-NO' : 'en', { month: 'long' })

  const hasData = statEvents.length > 0

  return (
    <div className="pb-28 md:pb-12">
      <TopBar title={t('title')} />
      <div className="px-5 md:px-8">
        {!hasData ? (
          <EmptyState
            icon={<TrendingUp size={26} />}
            title={t('noActivityTitle')}
            subtitle={t('noActivitySubtitle')}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <Card className="p-5">
              <p className="mb-4 text-[15px] font-bold text-[var(--color-ink)]">{monthLabel}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label={t('consumed')} value={monthStats.consumed} color="text-[var(--color-good)]" />
                <Stat label={t('expired')} value={monthStats.expired} color="text-[var(--color-bad)]" />
                <Stat label={t('added')} value={monthStats.added} color="text-[var(--color-accent)]" />
              </div>
            </Card>

            <Card className="flex items-center justify-between p-5">
              <div>
                <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">{t('foodWaste')}</p>
                <p className="text-[13px] text-[var(--color-ink-dim)]">{t('foodWasteSubtitle')}</p>
              </div>
              <span
                className={`text-[26px] font-bold ${monthStats.wastePercent > 20 ? 'text-[var(--color-bad)]' : 'text-[var(--color-good)]'}`}
              >
                {monthStats.wastePercent}%
              </span>
            </Card>

            {breakdown.length > 0 && (
              <Card className="p-5">
                <p className="mb-3.5 text-[14.5px] font-semibold text-[var(--color-ink)]">{t('mostAdded')}</p>
                <div className="flex flex-col gap-3">
                  {breakdown.slice(0, 6).map(({ categoryId, count }) => {
                    const cat = categories.find((c) => c.id === categoryId)
                    const max = breakdown[0].count
                    return (
                      <div key={categoryId} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10">
                          <CategoryIcon name={cat?.icon || 'Package'} size={15} />
                        </span>
                        <span className="w-20 shrink-0 truncate text-[13.5px] font-medium text-[var(--color-ink)]">
                          {cat ? getCategoryDisplayName(cat, t) : t('common:category.other')}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-[var(--color-accent)]"
                            style={{ width: `${Math.max(6, (count / max) * 100)}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-[13px] text-[var(--color-ink-faint)]">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const Stat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div>
    <p className={`text-[26px] font-bold ${color}`}>{value}</p>
    <p className="text-[12px] font-medium text-[var(--color-ink-dim)]">{label}</p>
  </div>
)
