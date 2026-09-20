import type { ExpirationStatus } from '../../types'
import { statusColors } from '../../lib/expiration'

export const StatusBadge = ({ status, label }: { status: ExpirationStatus; label: string }) => {
  const c = statusColors[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  )
}
