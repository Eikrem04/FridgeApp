import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { StorageUnit } from '../../types'
import { useStore } from '../../store/useStore'
import { getExpirationStatus } from '../../lib/expiration'
import { STORAGE_TYPE_META } from '../../lib/storageTypes'

export const StorageCard = ({ unit, index = 0 }: { unit: StorageUnit; index?: number }) => {
  const navigate = useNavigate()
  const allItems = useStore((s) => s.items)
  const items = useMemo(() => allItems.filter((it) => it.storageId === unit.id), [allItems, unit.id])
  const expiringSoonDays = useStore((s) => s.settings.expiration.expiringSoonDays)

  const expiringSoon = items.filter((it) => getExpirationStatus(it, expiringSoonDays) === 'expiringSoon' || getExpirationStatus(it, expiringSoonDays) === 'expiresToday').length
  const expired = items.filter((it) => getExpirationStatus(it, expiringSoonDays) === 'expired').length
  const meta = STORAGE_TYPE_META[unit.type]
  const Icon = meta.icon

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/storage/${unit.id}`)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full items-center gap-4 rounded-3xl bg-[var(--color-surface)] p-5 text-left transition active:scale-[0.985]"
    >
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${meta.bg} ${meta.text}`}>
        <Icon size={26} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[17px] font-bold text-[var(--color-ink)]">{unit.name}</h3>
        <p className="text-[14px] text-[var(--color-ink-dim)]">
          {items.length} {items.length === 1 ? 'item' : 'items'}
          {expiringSoon > 0 && (
            <span className="text-[var(--color-warn)]"> · {expiringSoon} expiring soon</span>
          )}
          {expired > 0 && <span className="text-[var(--color-bad)]"> · {expired} expired</span>}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-[var(--color-ink-faint)]" />
    </motion.button>
  )
}
