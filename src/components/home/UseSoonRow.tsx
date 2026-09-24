import { useTranslation } from 'react-i18next'
import type { InventoryItem } from '../../types'
import { useStore } from '../../store/useStore'
import { useUiStore } from '../../store/useUiStore'
import { CategoryIcon } from '../../lib/icons'
import { formatRelativeExpiration } from '../../lib/date'
import { getExpirationStatus, statusColors } from '../../lib/expiration'
import { motion } from 'framer-motion'

export const UseSoonRow = ({ item, index = 0 }: { item: InventoryItem; index?: number }) => {
  useTranslation('common') // subscribes to language changes so the relative-expiration text below stays in sync
  const category = useStore((s) => s.categories.find((c) => c.id === item.categoryId))
  const expiringSoonDays = useStore((s) => s.settings.expiration.expiringSoonDays)
  const openItem = useUiStore((s) => s.openItem)
  const status = getExpirationStatus(item, expiringSoonDays)
  const colors = statusColors[status]

  return (
    <motion.button
      type="button"
      onClick={() => openItem(item.id)}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      className="card-surface flex shrink-0 flex-col gap-3 rounded-3xl bg-[var(--color-surface)] p-4 text-left transition active:scale-[0.97]"
      style={{ width: 148 }}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${colors.bg} ${colors.text}`}>
        <CategoryIcon name={category?.icon || 'Package'} size={20} />
      </span>
      <span>
        <span className="block truncate text-[14.5px] font-semibold text-[var(--color-ink)]">{item.name}</span>
        <span className={`block text-[12.5px] font-medium ${colors.text}`}>{formatRelativeExpiration(item.expirationDate)}</span>
      </span>
    </motion.button>
  )
}
