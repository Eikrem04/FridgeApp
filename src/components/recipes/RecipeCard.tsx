import { useMemo } from 'react'
import { Flame, ImageOff, TriangleAlert, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RecipeMatch } from '../../types/recipe'
import { Card } from '../ui/Card'
import { useStore } from '../../store/useStore'
import { preferenceFitLabelKey } from '../../lib/recipeClassification'
import { findAvoidedIngredients } from '../../lib/avoidedIngredients'

const capitalize = (s: string) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s)

interface RecipeCardProps {
  match: RecipeMatch
  index?: number
  onClick: () => void
}

export const RecipeCard = ({ match, index = 0, onClick }: RecipeCardProps) => {
  const { t } = useTranslation('recipes')
  const mealInterests = useStore((s) => s.settings.recipePreferences.mealInterests)
  const avoidedIngredients = useStore((s) => s.settings.recipePreferences.avoidedIngredients)
  const { recipe, matchCount, totalCount, missing, usesSoonCount } = match
  const fitLabelKey = preferenceFitLabelKey(match.mealClass, mealInterests)
  // Suggestions already exclude these recipes entirely (see recipeRanking.ts) — this only
  // ever shows in practice on Search results, which are never filtered, per spec.
  const avoidedMatches = useMemo(() => findAvoidedIngredients(recipe, avoidedIngredients), [recipe, avoidedIngredients])

  return (
    <Card
      className="cursor-pointer overflow-hidden active:opacity-90"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3.5 p-4">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black/[0.05] text-[var(--color-ink-faint)] dark:bg-white/10">
            <ImageOff size={22} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-bold text-[var(--color-ink)]">{recipe.title}</h3>
          <p className="text-[13px] text-[var(--color-ink-dim)]">
            {missing.length === 0 ? t('match.haveEverything') : t('match.have', { count: matchCount, total: totalCount })}
          </p>
          {fitLabelKey && (
            <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[var(--color-accent)]">
              <UtensilsCrossed size={12} strokeWidth={2.5} /> {t(fitLabelKey)}
            </p>
          )}
          {usesSoonCount > 0 && (
            <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[var(--color-warn)]">
              <Flame size={12} strokeWidth={2.5} /> {t('match.usesSoon')}
            </p>
          )}
          {avoidedMatches.length > 0 && (
            <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[var(--color-bad)]">
              <TriangleAlert size={12} strokeWidth={2.5} /> {t('avoided.warning')}
            </p>
          )}
        </div>
      </div>
      {matchCount > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          {match.matched.slice(0, 6).map((ing) => (
            <span
              key={ing.name}
              className="rounded-full bg-[var(--color-good-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-good)]"
            >
              {capitalize(ing.displayName ?? ing.name)}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}
