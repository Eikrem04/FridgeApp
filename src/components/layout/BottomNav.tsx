import { NavLink } from 'react-router-dom'
import { Home, ListChecks, Plus, ShoppingCart, Settings } from 'lucide-react'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/inventory', label: 'Inventory', icon: ListChecks, end: false },
  { to: '/add', label: 'Add', icon: Plus, end: false, isCenter: true },
  { to: '/shopping', label: 'Shopping', icon: ShoppingCart, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export const BottomNav = () => {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-xl md:hidden">
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
