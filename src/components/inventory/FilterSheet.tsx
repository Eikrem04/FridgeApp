import { useTranslation } from 'react-i18next'
import { Sheet } from '../ui/Sheet'
import { useStore } from '../../store/useStore'
import { Button } from '../ui/Button'
import { CategoryIcon } from '../../lib/icons'
import { getStorageDisplayName } from '../../lib/storageTypes'
import { getCategoryDisplayName } from '../../lib/categoryLocalization'
import type { SortMode } from '../../lib/selectors'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  storageId: string | null
  setStorageId: (v: string | null) => void
  categoryId: string | null
  setCategoryId: (v: string | null) => void
  sort: SortMode
  setSort: (v: SortMode) => void
}

export const FilterSheet = ({
  open,
  onClose,
  storageId,
  setStorageId,
  categoryId,
  setCategoryId,
  sort,
  setSort,
}: FilterSheetProps) => {
  const { t } = useTranslation(['inventory', 'common'])
  const storageUnits = useStore((s) => s.storageUnits)
  const categories = useStore((s) => s.categories)

  const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: 'expiration', label: t('filterSheet.sort.expiration') },
    { value: 'name', label: t('filterSheet.sort.name') },
    { value: 'recent', label: t('filterSheet.sort.recent') },
    { value: 'quantity', label: t('filterSheet.sort.quantity') },
    { value: 'category', label: t('filterSheet.sort.category') },
  ]

  return (
    <Sheet open={open} onClose={onClose} title={t('filterSheet.title')}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-dim)]">{t('filterSheet.storage')}</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <Chip active={storageId === null} label={t('filterSheet.all')} onClick={() => setStorageId(null)} />
            {storageUnits.map((u) => (
              <Chip key={u.id} active={storageId === u.id} label={getStorageDisplayName(u, t)} onClick={() => setStorageId(u.id)} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-dim)]">{t('filterSheet.category')}</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <Chip active={categoryId === null} label={t('filterSheet.all')} onClick={() => setCategoryId(null)} />
            {categories.map((c) => (
              <Chip
                key={c.id}
                active={categoryId === c.id}
                label={getCategoryDisplayName(c, t)}
                icon={<CategoryIcon name={c.icon} size={14} />}
                onClick={() => setCategoryId(c.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-dim)]">{t('filterSheet.sortBy')}</p>
          <div className="flex flex-col gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSort(opt.value)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-[14.5px] font-medium transition ${
                  sort === opt.value ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
                }`}
              >
                {opt.label}
                {sort === opt.value && <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />}
              </button>
            ))}
          </div>
        </div>

        <Button fullWidth onClick={onClose}>
          {t('filterSheet.showResults')}
        </Button>
      </div>
    </Sheet>
  )
}

const Chip = ({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon?: React.ReactNode
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
      active ? 'bg-[var(--color-accent)] text-white' : 'bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10'
    }`}
  >
    {icon}
    {label}
  </button>
)
