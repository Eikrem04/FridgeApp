import { NavLink } from 'react-router-dom'
import { Home, ListChecks, Plus, ShoppingCart, Settings, ChefHat, TrendingUp, Refrigerator } from 'lucide-react'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/inventory', label: 'Inventory', icon: ListChecks, end: false },
  { to: '/shopping', label: 'Shopping List', icon: ShoppingCart, end: false },
  { to: '/recipes', label: 'Recipes', icon: ChefHat, end: false },
  { to: '/stats', label: 'Statistics', icon: TrendingUp, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export const Sidebar = () => {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
          <Refrigerator size={20} />
        </span>
        <span className="text-[17px] font-bold text-[var(--color-ink)]">Kitchen</span>
      </div>

      <NavLink
        to="/add"
        className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-[15px] font-semibold text-white transition active:scale-[0.98]"
      >
        <Plus size={18} strokeWidth={2.5} />
        Add item
      </NavLink>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition ${
                  isActive
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'text-[var(--color-ink-dim)] hover:bg-black/[0.04] dark:hover:bg-white/5'
                }`
              }
            >
              <Icon size={19} strokeWidth={2} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto px-2 text-xs text-[var(--color-ink-faint)]">Kitchen v1.0</div>
    </aside>
  )
}
