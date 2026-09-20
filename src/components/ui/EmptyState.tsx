import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export const EmptyState = ({ icon, title, subtitle, action }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center"
    >
      {icon && (
        <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] text-[var(--color-ink-faint)] dark:bg-white/5">
          {icon}
        </div>
      )}
      <p className="text-[17px] font-semibold text-[var(--color-ink)]">{title}</p>
      {subtitle && <p className="max-w-xs text-[15px] text-[var(--color-ink-dim)]">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  )
}
