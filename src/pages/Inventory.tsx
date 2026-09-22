import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, PackageSearch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { TopBar } from '../components/layout/TopBar'
import { ItemRow } from '../components/inventory/ItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { FilterSheet } from '../components/inventory/FilterSheet'
import type { SortMode } from '../lib/selectors'
import { sortItems } from '../lib/selectors'
import { getExpirationStatus } from '../lib/expiration'

type QuickFilter = 'all' | 'expiring' | 'expired' | 'fridge' | 'freezer' | 'pantry'

export const Inventory = () => {
  const { t } = useTranslation('inventory')
  const [params] = useSearchParams()
  const items = useStore((s) => s.items)
  const storageUnits = useStore((s) => s.storageUnits)
  const expiringSoonDays = useStore((s) => s.settings.expiration.expiringSoonDays)

  const [quickFilter, setQuickFilter] = useState<QuickFilter>((params.get('filter') as QuickFilter) || 'all')
  const [storageId, setStorageId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [sort, setSort] = useState<SortMode>('expiration')
  const [filterOpen, setFilterOpen] = useState(false)

  const expiringCount = items.filter((it) => ['expiringSoon', 'expiresToday'].includes(getExpirationStatus(it, expiringSoonDays))).length
  const expiredCount = items.filter((it) => getExpirationStatus(it, expiringSoonDays) === 'expired').length

  const filtered = useMemo(() => {
    let arr = items
    if (quickFilter === 'expiring') {
      arr = arr.filter((it) => ['expiringSoon', 'expiresToday'].includes(getExpirationStatus(it, expiringSoonDays)))
    } else if (quickFilter === 'expired') {
      arr = arr.filter((it) => getExpirationStatus(it, expiringSoonDays) === 'expired')
    } else if (quickFilter === 'fridge' || quickFilter === 'freezer' || quickFilter === 'pantry') {
      const ids = new Set(storageUnits.filter((u) => u.type === quickFilter).map((u) => u.id))
      arr = arr.filter((it) => ids.has(it.storageId))
    }
    if (storageId) arr = arr.filter((it) => it.storageId === storageId)
    if (categoryId) arr = arr.filter((it) => it.categoryId === categoryId)
    return sortItems(arr, sort)
  }, [items, quickFilter, storageId, categoryId, sort, storageUnits, expiringSoonDays])

  const activeFilterCount = (storageId ? 1 : 0) + (categoryId ? 1 : 0) + (sort !== 'expiration' ? 1 : 0)

  const quickFilters: { value: QuickFilter; label: string }[] = [
    { value: 'all', label: t('filters.all') },
    { value: 'expiring', label: t('filters.expiring') },
    { value: 'expired', label: t('filters.expired') },
    { value: 'fridge', label: t('filters.fridge') },
    { value: 'freezer', label: t('filters.freezer') },
    { value: 'pantry', label: t('filters.pantry') },
  ]

  return (
    <div className="pb-28 md:pb-12">
      <TopBar title={t('title')} />
      <div className="px-5 md:px-8">
        <div className="mb-4 flex items-center gap-4 text-[14px]">
          <span className="font-semibold text-[var(--color-ink)]">{t('itemsCount', { count: items.length })}</span>
          {expiringCount > 0 && <span className="font-medium text-[var(--color-warn)]">{t('expiringSoonCount', { count: expiringCount })}</span>}
          {expiredCount > 0 && <span className="font-medium text-[var(--color-bad)]">{t('expiredCount', { count: expiredCount })}</span>}
        </div>

        <div className="flex items-center gap-2">
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {quickFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setQuickFilter(f.value)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
                  quickFilter === f.value ? 'bg-[var(--color-accent)] text-white' : 'bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10"
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
            )}
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {filtered.map((item) => (
              <ItemRow key={item.id} item={item} showStorage={storageUnits.length > 1} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <EmptyState
              icon={<PackageSearch size={26} />}
              title={t('noItemsTitle')}
              subtitle={t('noItemsSubtitle')}
            />
          )}
        </div>
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        storageId={storageId}
        setStorageId={setStorageId}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        sort={sort}
        setSort={setSort}
      />
    </div>
  )
}
