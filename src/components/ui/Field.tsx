import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldWrapProps {
  label: string
  children: ReactNode
  hint?: string
}

export const FieldWrap = ({ label, children, hint }: FieldWrapProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="px-1 text-[13px] font-medium text-[var(--color-ink-dim)]">{label}</label>
    {children}
    {hint && <span className="px-1 text-xs text-[var(--color-ink-faint)]">{hint}</span>}
  </div>
)

const fieldBaseClass =
  'w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3.5 text-[16px] text-[var(--color-ink)] outline-none ring-2 ring-transparent transition placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]'

export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`${fieldBaseClass} ${props.className ?? ''}`} />
)

export const TextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`${fieldBaseClass} resize-none ${props.className ?? ''}`} />
)

export const SelectInput = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`${fieldBaseClass} appearance-none ${props.className ?? ''}`} />
)
