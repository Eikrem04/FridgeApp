import { NavLink } from 'react-router-dom'
import { Home, ListChecks, Plus, ShoppingCart, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const BottomNav = () => {
  const { t } = useTranslation('common')
  const items = [
    { to: '/', label: t('nav.home'), icon: Home, end: true },
    { to: '/inventory', label: t('nav.inventory'), icon: ListChecks, end: false },
    { to: '/add', label: t('nav.add'), icon: Plus, end: false, isCenter: true },
    { to: '/shopping', label: t('nav.shopping'), icon: ShoppingCart, end: false },
    { to: '/settings', label: t('nav.settings'), icon: Settings, end: false },
  ]

  return (
    <nav className="safe-bottom safe-left safe-right fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-1 pt-1.5">
        {items.map((item) => {
          const Icon = item.icon
          if (item.isCenter) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className="flex -translate-y-3 flex-col items-center gap-1"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30 transition active:scale-95">
                  <Icon size={26} strokeWidth={2.4} />
                </span>
              </NavLink>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-2xl px-4 py-1.5 transition ${
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-faint)]'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
