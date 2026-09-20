import { Minus, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
}

export const Stepper = ({ value, onChange, min = 0, max = 999, size = 'md' }: StepperProps) => {
  const btnSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`flex ${btnSize} items-center justify-center rounded-full bg-black/[0.06] text-[var(--color-ink)] transition active:scale-90 disabled:opacity-30 dark:bg-white/10`}
      >
        <Minus size={16} />
      </button>
      <div className="w-8 overflow-hidden text-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="block text-[17px] font-semibold tabular-nums text-[var(--color-ink)]"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`flex ${btnSize} items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition active:scale-90 disabled:opacity-30`}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
