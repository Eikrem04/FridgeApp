import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
}

export const Sheet = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }: SheetProps) => {
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className={`safe-bottom relative z-10 flex max-h-[90svh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-[28px] bg-[var(--color-surface)] md:rounded-[28px] md:mb-8`}
          >
            <div className="flex items-center justify-center pt-2.5 md:hidden">
              <div className="h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <h2 className="text-[17px] font-semibold text-[var(--color-ink)]">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
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
