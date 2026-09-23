import { useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { useDialogA11y } from '../../lib/useDialogA11y'

interface ZeroQuantityDialogProps {
  open: boolean
  itemName: string
  onKeepAtZero: () => void
  onAddToShoppingList: () => void
  onRemove: () => void
}

/**
 * Shown when an item's quantity is stepped down to 0. Three explicit, equally
 * visible choices — nothing here ever happens automatically: dismissing (via
 * backdrop or "Keep at 0") always just leaves the item at 0, unchanged.
 */
export const ZeroQuantityDialog = ({ open, itemName, onKeepAtZero, onAddToShoppingList, onRemove }: ZeroQuantityDialogProps) => {
  const { t } = useTranslation('addItem')
  const titleId = useId()
  const containerRef = useDialogA11y(open, onKeepAtZero)
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onKeepAtZero}
          />
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="relative z-10 w-full max-w-sm rounded-3xl bg-[var(--color-surface)] p-6 text-center shadow-2xl outline-none"
          >
            <h3 id={titleId} className="text-[17px] font-semibold text-[var(--color-ink)]">
              {t('detail.zeroPromptTitle', { name: itemName })}
            </h3>
            <p className="mt-2 text-[15px] text-[var(--color-ink-dim)]">{t('detail.zeroPromptMessage')}</p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Button fullWidth onClick={onAddToShoppingList}>
                {t('detail.addToShoppingList')}
              </Button>
              <Button variant="secondary" fullWidth onClick={onKeepAtZero}>
                {t('detail.keepAtZero')}
              </Button>
              <Button variant="danger" fullWidth onClick={onRemove}>
                {t('detail.removeFromInventory')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
