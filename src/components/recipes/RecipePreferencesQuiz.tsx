import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../store/useStore'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import type { RecipePreferences } from '../../types/recipePreferences'
import {
  AvoidedIngredientsField,
  CookingTimeField,
  DietaryField,
  HouseholdSizeField,
  InventoryImportanceField,
  MealInterestField,
} from './RecipePreferenceFields'

const STEPS = ['mealInterests', 'inventoryImportance', 'dietary', 'householdSize', 'cookingTime', 'avoidedIngredients'] as const
type Step = (typeof STEPS)[number]

/**
 * Short, optional, skippable setup flow shown once from the Recipes page —
 * not the app's main onboarding — so it lives as a Sheet rather than a
 * full-screen takeover. See Recipes.tsx for the "show only once" logic
 * (gated on settings.recipePreferences.setupSeen).
 */
export const RecipePreferencesQuiz = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation('recipes')
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<RecipePreferences>(settings.recipePreferences)

  const step: Step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  const skip = () => {
    updateSettings({ recipePreferences: { ...settings.recipePreferences, setupSeen: true } })
    onClose()
  }

  const next = () => {
    if (!isLast) {
      setStepIndex((i) => i + 1)
      return
    }
    updateSettings({ recipePreferences: { ...draft, setupSeen: true } })
    onClose()
  }

  return (
    <Sheet open={open} onClose={skip} title={t('preferences.quiz.heading')}>
      <div className="flex flex-col gap-5">
        <p className="text-[14.5px] text-[var(--color-ink-dim)]">{t('preferences.quiz.subtitle')}</p>

        <div>
          <p className="mb-3 text-[13px] font-semibold text-[var(--color-ink-dim)]">{t(`preferences.fields.${step}.label`)}</p>
          {step === 'mealInterests' && (
            <MealInterestField value={draft.mealInterests} onChange={(mealInterests) => setDraft((d) => ({ ...d, mealInterests }))} />
          )}
          {step === 'inventoryImportance' && (
            <InventoryImportanceField
              value={draft.inventoryImportance}
              onChange={(inventoryImportance) => setDraft((d) => ({ ...d, inventoryImportance }))}
            />
          )}
          {step === 'dietary' && <DietaryField value={draft.dietary} onChange={(dietary) => setDraft((d) => ({ ...d, dietary }))} />}
          {step === 'householdSize' && (
            <HouseholdSizeField value={draft.householdSize} onChange={(householdSize) => setDraft((d) => ({ ...d, householdSize }))} />
          )}
          {step === 'cookingTime' && (
            <CookingTimeField value={draft.cookingTime} onChange={(cookingTime) => setDraft((d) => ({ ...d, cookingTime }))} />
          )}
          {step === 'avoidedIngredients' && (
            <AvoidedIngredientsField
              value={draft.avoidedIngredients}
              onChange={(avoidedIngredients) => setDraft((d) => ({ ...d, avoidedIngredients }))}
            />
          )}
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          <button type="button" onClick={skip} className="text-[14px] font-semibold text-[var(--color-ink-dim)]">
            {t('preferences.quiz.skip')}
          </button>
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 w-1.5 rounded-full ${i === stepIndex ? 'bg-[var(--color-accent)]' : 'bg-black/15 dark:bg-white/20'}`}
              />
            ))}
          </div>
          <Button onClick={next}>{isLast ? t('preferences.quiz.finish') : t('preferences.quiz.continue')}</Button>
        </div>
      </div>
    </Sheet>
  )
}
