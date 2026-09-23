import { useMemo } from 'react'
import { Check, ExternalLink, CirclePlay, Plus, TriangleAlert, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RecipeMatch } from '../../types/recipe'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { useStore } from '../../store/useStore'
import { useToastStore } from '../../store/useToastStore'
import { findAvoidedIngredients } from '../../lib/avoidedIngredients'

const capitalize = (s: string) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s)

interface RecipeDetailSheetProps {
  match: RecipeMatch | null
  onClose: () => void
}

export const RecipeDetailSheet = ({ match, onClose }: RecipeDetailSheetProps) => {
  const { t } = useTranslation('recipes')
  const shoppingList = useStore((s) => s.shoppingList)
  const addShoppingItem = useStore((s) => s.addShoppingItem)
  const avoidedIngredients = useStore((s) => s.settings.recipePreferences.avoidedIngredients)
  const showToast = useToastStore((s) => s.show)

  // Hooks must run unconditionally — match may be null, so this guards internally.
  const avoidedMatches = useMemo(
    () => (match ? findAvoidedIngredients(match.recipe, avoidedIngredients) : []),
    [match, avoidedIngredients],
  )

  if (!match) return null
  const { recipe, matched, missing } = match

  const isOnList = (name: string) =>
    shoppingList.some((item) => !item.purchased && item.name.trim().toLowerCase() === name.trim().toLowerCase())

  const addOne = (name: string) => {
    if (isOnList(name)) {
      showToast(t('detail.alreadyOnListToast', { name: capitalize(name) }))
      return
    }
    addShoppingItem(capitalize(name))
    showToast(t('detail.addedOneToast', { name: capitalize(name) }))
  }

  const addAllMissing = () => {
    const toAdd = missing.filter((ing) => !isOnList(ing.name))
    if (toAdd.length === 0) {
      showToast(t('detail.allAdded'))
      return
    }
    for (const ing of toAdd) addShoppingItem(capitalize(ing.name))
    showToast(t('detail.addedToast', { count: toAdd.length }))
  }

  return (
    <Sheet open={!!match} onClose={onClose} maxWidth="max-w-xl">
      <div className="-mx-6 -mt-2 mb-2">
        {recipe.imageUrl && (
          <img src={recipe.imageUrl} alt="" className="aspect-[16/10] w-full object-cover md:rounded-t-[28px]" />
        )}
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[19px] font-bold text-[var(--color-ink)]">{recipe.title}</h2>
            {(recipe.category || recipe.area) && (
              <p className="text-[13.5px] text-[var(--color-ink-dim)]">
                {[recipe.category, recipe.area].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common:actions.close')}
            className="shrink-0 rounded-full bg-black/[0.05] p-1.5 text-[var(--color-ink-dim)] transition hover:bg-black/10 dark:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {avoidedMatches.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-bad-soft)] p-4">
            <p className="flex items-center gap-2 text-[14.5px] font-semibold text-[var(--color-bad)]">
              <TriangleAlert size={16} strokeWidth={2.5} className="shrink-0" /> {t('avoided.warning')}
            </p>
            <p className="mt-2 text-[13.5px] font-medium text-[var(--color-bad)]">
              {avoidedMatches.map((ing) => capitalize(ing.name)).join(', ')}
            </p>
            <p className="mt-2 text-[12.5px] text-[var(--color-ink-dim)]">{t('avoided.disclaimer')}</p>
          </div>
        )}

        <p className="text-[14.5px] font-semibold text-[var(--color-ink)]">
          {missing.length === 0 ? t('match.haveEverything') : t('match.have', { count: match.matchCount, total: match.totalCount })}
        </p>

        {matched.length > 0 && (
          <div>
            <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-dim)]">{t('detail.inYourKitchen')}</p>
            <div className="flex flex-col gap-1.5">
              {matched.map((ing) => (
                <div key={ing.name} className="flex items-center gap-2 text-[14.5px] text-[var(--color-ink)]">
                  <Check size={15} strokeWidth={3} className="shrink-0 text-[var(--color-good)]" />
                  <span className="flex-1">{capitalize(ing.name)}</span>
                  {ing.measure && <span className="text-[13px] text-[var(--color-ink-faint)]">{ing.measure}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {missing.length > 0 && (
          <div>
            <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-dim)]">{t('detail.missing')}</p>
            <div className="flex flex-col gap-1.5">
              {missing.map((ing) => (
                <div key={ing.name} className="flex items-center gap-2 text-[14.5px] text-[var(--color-ink)]">
                  <span className="flex-1">
                    {capitalize(ing.name)}
                    {ing.measure && <span className="ml-2 text-[13px] text-[var(--color-ink-faint)]">{ing.measure}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => addOne(ing.name)}
                    aria-label={t('detail.addOne')}
                    className="shrink-0 rounded-full bg-black/[0.05] p-1.5 text-[var(--color-accent)] transition active:scale-90 dark:bg-white/10"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="secondary" fullWidth size="sm" className="mt-3" onClick={addAllMissing}>
              {t('detail.addMissing')}
            </Button>
          </div>
        )}

        {recipe.instructions && (
          <div>
            <p className="mb-2 text-[13px] font-semibold text-[var(--color-ink-dim)]">{t('detail.instructions')}</p>
            <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-[var(--color-ink)]">{recipe.instructions}</p>
          </div>
        )}

        {(recipe.sourceUrl || recipe.youtubeUrl) && (
          <div className="flex gap-3">
            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black/[0.05] px-4 py-3 text-[14px] font-semibold text-[var(--color-ink)] dark:bg-white/10"
              >
                <ExternalLink size={15} /> {t('detail.source')}
              </a>
            )}
            {recipe.youtubeUrl && (
              <a
                href={recipe.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black/[0.05] px-4 py-3 text-[14px] font-semibold text-[var(--color-ink)] dark:bg-white/10"
              >
                <CirclePlay size={15} /> {t('detail.video')}
              </a>
            )}
          </div>
        )}
      </div>
    </Sheet>
  )
}
