interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="flex rounded-2xl bg-black/[0.05] p-1 dark:bg-white/10">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-xl px-3 py-2 text-[14px] font-semibold transition-all ${
            value === opt.value
              ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm'
              : 'text-[var(--color-ink-dim)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
