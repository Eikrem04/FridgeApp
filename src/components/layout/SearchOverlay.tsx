import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../store/useStore'
import { ItemRow } from '../inventory/ItemRow'
import { EmptyState } from '../ui/EmptyState'

export const SearchOverlay = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation(['inventory', 'common'])
  const [query, setQuery] = useState('')
  const items = useStore((s) => s.items)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return items
      .filter((it) => it.name.toLowerCase().includes(q) || it.notes?.toLowerCase().includes(q))
      .slice(0, 50)
  }, [items, query])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex flex-col bg-[var(--color-bg)]"
        >
          <div className="safe-top flex items-center gap-2 px-4 pb-3 pt-4">
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-black/[0.05] px-4 py-3 dark:bg-white/10">
              <Search size={18} className="text-[var(--color-ink-faint)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full bg-transparent text-[16px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common:actions.close')}
              className="rounded-full bg-black/[0.05] p-2.5 text-[var(--color-ink)] dark:bg-white/10"
            >
              <X size={19} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {query.trim() === '' && (
              <EmptyState
                icon={<Search size={26} />}
                title={t('search.emptyTitle')}
                subtitle={t('search.emptySubtitle')}
              />
            )}
            {query.trim() !== '' && results.length === 0 && (
              <EmptyState title={t('search.noMatchesTitle')} subtitle={t('search.noMatchesSubtitle', { query })} />
            )}
            {results.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                {results.map((item) => (
                  <div key={item.id} onClick={onClose}>
                    <ItemRow item={item} showStorage />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
