import { useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { InventoryItem } from '../../types'
import { RECIPES_DB } from '../../data/recipesDb'
import { matchRecipes } from '../../lib/recipes'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useStore } from '../../store/useStore'
import { useToastStore } from '../../store/useToastStore'

const capitalize = (s: string) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s)

/**
 * Shown only when the live TheMealDB request fails — a small, clearly-labeled
 * fallback built from Kitchen's bundled static recipe list, so a network
 * hiccup doesn't leave the Suggestions tab completely empty. Never mixed
 * into the same list as live API results.
 */
export const OfflineSuggestions = ({ items }: { items: InventoryItem[] }) => {
  const { t } = useTranslation('recipes')
  const addShoppingItem = useStore((s) => s.addShoppingItem)
  const shoppingList = useStore((s) => s.shoppingList)
  const showToast = useToastStore((s) => s.show)
  const matches = useMemo(() => matchRecipes(items, RECIPES_DB).slice(0, 6), [items])

  if (matches.length === 0) return null

  const isOnList = (name: string) =>
    shoppingList.some((item) => !item.purchased && item.name.trim().toLowerCase() === name.trim().toLowerCase())

  const addMissing = (missing: string[]) => {
    const toAdd = missing.filter((name) => !isOnList(name))
    if (toAdd.length === 0) {
      showToast(t('detail.allAdded'))
      return
    }
    for (const name of toAdd) addShoppingItem(capitalize(name))
    showToast(t('detail.addedToast', { count: toAdd.length }))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="px-1">
        <p className="text-[15px] font-semibold text-[var(--color-ink)]">{t('suggestions.offlineTitle')}</p>
        <p className="text-[13px] text-[var(--color-ink-dim)]">{t('suggestions.offlineSubtitle')}</p>
      </div>
      {matches.map(({ recipe, matched, missing }) => (
        <Card key={recipe.id} className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/[0.05] text-xl dark:bg-white/10">
              {recipe.icon}
            </span>
            <h3 className="text-[15.5px] font-bold text-[var(--color-ink)]">{recipe.name}</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {matched.map((ing) => (
              <span
                key={ing}
                className="flex items-center gap-1 rounded-full bg-[var(--color-good-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-good)]"
              >
                <Check size={11} strokeWidth={3} /> {ing}
              </span>
            ))}
            {missing.map((ing) => (
              <span
                key={ing}
                className="flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] font-medium text-[var(--color-ink-faint)] dark:bg-white/5"
              >
                <X size={11} strokeWidth={3} /> {ing}
              </span>
            ))}
          </div>
          {missing.length > 0 && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => addMissing(missing)}>
              {t('detail.addMissing')}
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}
