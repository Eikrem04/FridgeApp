import { motion } from 'framer-motion'
import { Check, Trash2 } from 'lucide-react'
import type { ShoppingListItem } from '../../types'

interface ShoppingRowProps {
  item: ShoppingListItem
  onToggle: () => void
  onRemove: () => void
}

export const ShoppingRow = ({ item, onToggle, onRemove }: ShoppingRowProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3.5"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={item.purchased ? 'Mark as not purchased' : 'Mark as purchased'}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
          item.purchased ? 'border-[var(--color-good)] bg-[var(--color-good)] text-white' : 'border-black/15 dark:border-white/20'
        }`}
      >
        {item.purchased && <Check size={14} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15.5px] font-medium ${item.purchased ? 'text-[var(--color-ink-faint)] line-through' : 'text-[var(--color-ink)]'}`}>
          {item.name}
        </p>
        {(item.quantity || item.unit) && (
          <p className="text-[12.5px] text-[var(--color-ink-faint)]">
            {item.quantity ?? 1} {item.unit ?? 'pcs'}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-faint)] transition hover:bg-black/[0.04] dark:hover:bg-white/5"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  )
}
