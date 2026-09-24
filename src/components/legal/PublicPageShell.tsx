import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat } from 'lucide-react'

/**
 * Shared chrome for standalone, publicly-accessible pages (Privacy, Support) that live outside
 * the authenticated app shell — see main.tsx, where /privacy and /support are routed before the
 * auth-gated <App/>, so they're always reachable logged out. Deliberately does not reuse
 * AppShell/TopBar/BottomNav, which are part of the authenticated in-app experience.
 */
export const PublicPageShell = ({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated?: string
  children: ReactNode
}) => (
  <div className="min-h-screen bg-[var(--color-bg)]">
    <div className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-16">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--color-accent)]">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <ChefHat size={16} />
        </span>
        Kitch
      </Link>

      <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-ink)]">{title}</h1>
      {lastUpdated && <p className="mt-1 text-[13.5px] text-[var(--color-ink-faint)]">Last updated: {lastUpdated}</p>}

      <div className="card-surface mt-6 rounded-3xl bg-[var(--color-surface)] p-6 md:p-8">
        <div className="flex flex-col gap-6 text-[15px] leading-relaxed text-[var(--color-ink)]">{children}</div>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-[13.5px] font-medium text-[var(--color-ink-dim)]">
        <Link to="/privacy" className="hover:text-[var(--color-accent)]">
          Privacy Policy
        </Link>
        <Link to="/support" className="hover:text-[var(--color-accent)]">
          Support
        </Link>
      </div>
    </div>
  </div>
)

export const Section = ({ heading, children }: { heading: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h2 className="text-[17px] font-bold text-[var(--color-ink)]">{heading}</h2>
    <div className="flex flex-col gap-3 text-[var(--color-ink-dim)]">{children}</div>
  </section>
)
