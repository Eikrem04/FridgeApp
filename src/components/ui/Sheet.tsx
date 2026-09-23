import type { ReactNode } from 'react'
import { useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDialogA11y } from '../../lib/useDialogA11y'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
}

export const Sheet = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }: SheetProps) => {
  const { t } = useTranslation('common')
  const titleId = useId()
  const containerRef = useDialogA11y(open, onClose)
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className={`safe-bottom relative z-10 flex max-h-[90svh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-[28px] bg-[var(--color-surface)] outline-none md:rounded-[28px] md:mb-8`}
          >
            <div className="flex items-center justify-center pt-2.5 md:hidden">
              <div className="h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <h2 id={titleId} className="text-[17px] font-semibold text-[var(--color-ink)]">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('actions.close')}
                  className="rounded-full bg-black/[0.05] p-1.5 text-[var(--color-ink-dim)] transition hover:bg-black/10 dark:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto px-6 pb-6 pt-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
