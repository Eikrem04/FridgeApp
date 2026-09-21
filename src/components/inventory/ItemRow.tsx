import { useState } from 'react'
import { motion } from 'framer-motion'
import type { InventoryItem } from '../../types'
import { useStore } from '../../store/useStore'
import { useUiStore } from '../../store/useUiStore'
import { getExpirationStatus, statusColors } from '../../lib/expiration'
import { formatRelativeExpiration } from '../../lib/date'
import { CategoryIcon } from '../../lib/icons'

export const ItemRow = ({ item, showStorage = false }: { item: InventoryItem; showStorage?: boolean }) => {
  const category = useStore((s) => s.categories.find((c) => c.id === item.categoryId))
  const storage = useStore((s) => s.storageUnits.find((u) => u.id === item.storageId))
  const expiringSoonDays = useStore((s) => s.settings.expiration.expiringSoonDays)
  const openItem = useUiStore((s) => s.openItem)
  const status = getExpirationStatus(item, expiringSoonDays)
  const colors = statusColors[status]
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <motion.button
      layout
      type="button"
      onClick={() => openItem(item.id)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="flex w-full items-center gap-3.5 rounded-2xl bg-[var(--color-surface)] px-4 py-3.5 text-left transition active:scale-[0.99]"
    >
      {item.imageUrl && !imageFailed ? (
        <img
          src={item.imageUrl}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.text}`}>
          <CategoryIcon name={category?.icon || 'Package'} size={20} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15.5px] font-semibold text-[var(--color-ink)]">{item.name}</span>
        </span>
        <span className="flex items-center gap-1.5 text-[13px] text-[var(--color-ink-dim)]">
          <span className={colors.text}>{formatRelativeExpiration(item.expirationDate)}</span>
          {showStorage && storage && (
            <>
              <span className="text-[var(--color-ink-faint)]">·</span>
              <span className="truncate">{storage.name}</span>
            </>
          )}
        </span>
      </span>
      <span className="shrink-0 text-[14px] font-medium text-[var(--color-ink-faint)]">
        {item.quantity} {item.unit}
      </span>
    </motion.button>
  )
}
