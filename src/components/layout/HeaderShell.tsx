import type { ReactNode } from 'react'

interface HeaderShellProps {
  title?: ReactNode
  leading?: ReactNode
  actions?: ReactNode
}

/**
 * Shared structural shell for every sticky page header (TopBar, StorageDetail's header, …) — the
 * single place responsive header spacing/overflow behavior lives, so a fix here applies
 * everywhere rather than needing a per-page patch.
 *
 * Safe-area padding lives on this OUTER element (so the translucent background still bleeds
 * edge-to-edge under a notch/Dynamic Island in landscape) while the visual px/py padding lives on
 * the INNER row, on purpose: Tailwind's own utilities are cascade-layered, but the .safe-* classes
 * in index.css aren't, so combining both on the SAME element lets one silently replace the other
 * instead of adding together (verified directly — on any element with zero safe-area inset, which
 * is every desktop browser and most phone orientations, .safe-left/.safe-right fully overrode
 * Tailwind's px-* with 0, collapsing the header's horizontal padding to nothing). Splitting them
 * across two nested elements sidesteps the conflict entirely via normal box-model nesting instead
 * of relying on cascade order — the same pattern BottomNav.tsx already uses correctly.
 *
 * `min-w-0` + `truncate` on the title and `shrink-0` on the actions group guarantee a long title
 * can never push the actions group off-screen — the title yields (truncates) instead.
 */
export const HeaderShell = ({ title, leading, actions }: HeaderShellProps) => (
  <header className="safe-top safe-left safe-right sticky top-0 z-30 bg-[var(--color-bg)]/85 backdrop-blur-xl">
    <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4 md:px-8 md:pt-6">
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        {title ? (
          <h1 className="truncate text-[22px] font-bold tracking-tight text-[var(--color-ink)]">{title}</h1>
        ) : (
          <span />
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  </header>
)
