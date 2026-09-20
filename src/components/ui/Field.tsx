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

export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full rounded-2xl bg-black/[0.04] px-4 py-3.5 text-[16px] text-[var(--color-ink)] outline-none ring-2 ring-transparent transition placeholder:text-[var(--color-ink-faint)] focus:ring-[var(--color-accent)] dark:bg-white/[0.06] ${props.className ?? ''}`}
  />
)

export const TextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full resize-none rounded-2xl bg-black/[0.04] px-4 py-3.5 text-[16px] text-[var(--color-ink)] outline-none ring-2 ring-transparent transition placeholder:text-[var(--color-ink-faint)] focus:ring-[var(--color-accent)] dark:bg-white/[0.06] ${props.className ?? ''}`}
  />
)

export const SelectInput = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full appearance-none rounded-2xl bg-black/[0.04] px-4 py-3.5 text-[16px] text-[var(--color-ink)] outline-none ring-2 ring-transparent transition focus:ring-[var(--color-accent)] dark:bg-white/[0.06] ${props.className ?? ''}`}
  />
)
