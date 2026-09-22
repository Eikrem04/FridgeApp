import { useMemo } from 'react'
import { ChefHat, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { TopBar } from '../components/layout/TopBar'
import { EmptyState } from '../components/ui/EmptyState'
import { RECIPES_DB } from '../data/recipesDb'
import { matchRecipes } from '../lib/recipes'
import { Card } from '../components/ui/Card'

export const Recipes = () => {
  const { t } = useTranslation('recipes')
  const items = useStore((s) => s.items)
  const matches = useMemo(() => matchRecipes(items, RECIPES_DB), [items])

  return (
    <div className="pb-28 md:pb-12">
      <TopBar title={t('title')} />
      <div className="px-5 md:px-8">
        {items.length === 0 ? (
          <EmptyState
            icon={<ChefHat size={26} />}
            title={t('noItemsTitle')}
            subtitle={t('noItemsSubtitle')}
          />
        ) : matches.length === 0 ? (
          <EmptyState
            icon={<ChefHat size={26} />}
            title={t('noMatchesTitle')}
            subtitle={t('noMatchesSubtitle')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map(({ recipe, matched, missing }, i) => (
              <Card key={recipe.id} className="p-5" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.05] text-2xl dark:bg-white/10">
                    {recipe.icon}
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-[var(--color-ink)]">{recipe.name}</h3>
                    <p className="text-[13px] text-[var(--color-ink-dim)]">
                      {missing.length === 0 ? t('haveEverything') : t('missingIngredients', { count: missing.length })}
                    </p>
                  </div>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {matched.map((ing) => (
                    <span
                      key={ing}
                      className="flex items-center gap-1 rounded-full bg-[var(--color-good-soft)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-good)]"
                    >
                      <Check size={11} strokeWidth={3} /> {ing}
                    </span>
                  ))}
                  {missing.map((ing) => (
                    <span
                      key={ing}
                      className="flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-ink-faint)] dark:bg-white/5"
                    >
                      <X size={11} strokeWidth={3} /> {ing}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
