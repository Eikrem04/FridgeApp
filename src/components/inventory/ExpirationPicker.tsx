import { addDaysISO, formatFriendlyDate, todayISODate } from '../../lib/date'

interface ExpirationPickerProps {
  value: string | null
  onChange: (value: string | null) => void
}

const QUICK_OPTIONS: { label: string; days: number | null }[] = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
]

export const ExpirationPicker = ({ value, onChange }: ExpirationPickerProps) => {
  const activeDays = value ? Math.round((new Date(value).getTime() - new Date(todayISODate()).getTime()) / 86400000) : null

  return (
    <div className="flex flex-col gap-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(addDaysISO(opt.days!))}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
              activeDays === opt.days
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`shrink-0 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
            value === null ? 'bg-[var(--color-accent)] text-white' : 'bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10'
          }`}
        >
          None
        </button>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-black/[0.04] px-4 py-3 dark:bg-white/[0.06]">
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="flex-1 bg-transparent text-[15px] text-[var(--color-ink)] outline-none"
        />
        {value && <span className="text-[13px] text-[var(--color-ink-dim)]">{formatFriendlyDate(value)}</span>}
      </div>
    </div>
  )
}
