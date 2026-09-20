import type { ReactNode } from 'react'
import { Card } from '../ui/Card'

export const SettingsSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mb-6">
    <p className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">{title}</p>
    <Card animate={false} className="divide-y divide-[var(--color-line)] overflow-hidden">
      {children}
    </Card>
  </div>
)

export const SettingsRow = ({
  icon,
  label,
  sub,
  right,
  onClick,
}: {
  icon?: ReactNode
  label: string
  sub?: string
  right?: ReactNode
  onClick?: () => void
}) => {
  const content = (
    <>
      {icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-[var(--color-ink)]">{label}</span>
        {sub && <span className="block truncate text-[12.5px] text-[var(--color-ink-faint)]">{sub}</span>}
      </span>
      {right}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        {content}
      </button>
    )
  }

  return <div className="flex w-full items-center gap-3 px-4 py-3.5">{content}</div>
}
