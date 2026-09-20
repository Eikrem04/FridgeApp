import type { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  animate?: boolean
}

export const Card = ({ children, className = '', animate = true, ...props }: CardProps) => {
  if (!animate) {
    return (
      <div className={`rounded-3xl bg-[var(--color-surface)] ${className}`} {...props}>
        {children}
      </div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-3xl bg-[var(--color-surface)] ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.div>
  )
}
