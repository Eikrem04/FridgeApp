import { useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from './Button'
import { useDialogA11y } from '../../lib/useDialogA11y'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const titleId = useId()
  const containerRef = useDialogA11y(open, onCancel)
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onCancel}
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
              {title}
            </h3>
            {message && <p className="mt-2 text-[15px] text-[var(--color-ink-dim)]">{message}</p>}
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" fullWidth onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button variant={danger ? 'danger' : 'primary'} fullWidth onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
