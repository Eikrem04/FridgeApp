import { useTranslation } from 'react-i18next'
import { useStore } from '../../store/useStore'
import { Sheet } from '../ui/Sheet'
import type { RecipePreferences } from '../../types/recipePreferences'
import {
  AvoidedIngredientsField,
  CookingTimeField,
  DietaryField,
  HouseholdSizeField,
  InventoryImportanceField,
  MealInterestField,
} from '../recipes/RecipePreferenceFields'

const FIELDS = ['mealInterests', 'inventoryImportance', 'dietary', 'householdSize', 'cookingTime', 'avoidedIngredients'] as const

export const RecipePreferencesSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation('recipes')
  const prefs = useStore((s) => s.settings.recipePreferences)
  const updateSettings = useStore((s) => s.updateSettings)

  const patch = (fields: Partial<RecipePreferences>) => {
    updateSettings({ recipePreferences: { ...prefs, ...fields, setupSeen: true } })
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('preferences.title')}>
      <div className="flex flex-col gap-6">
        {FIELDS.map((field) => (
          <div key={field}>
            <p className="mb-3 text-[13px] font-semibold text-[var(--color-ink-dim)]">{t(`preferences.fields.${field}.label`)}</p>
            {field === 'mealInterests' && (
              <MealInterestField value={prefs.mealInterests} onChange={(mealInterests) => patch({ mealInterests })} />
            )}
            {field === 'inventoryImportance' && (
              <InventoryImportanceField value={prefs.inventoryImportance} onChange={(inventoryImportance) => patch({ inventoryImportance })} />
            )}
            {field === 'dietary' && <DietaryField value={prefs.dietary} onChange={(dietary) => patch({ dietary })} />}
            {field === 'householdSize' && (
              <HouseholdSizeField value={prefs.householdSize} onChange={(householdSize) => patch({ householdSize })} />
            )}
            {field === 'cookingTime' && <CookingTimeField value={prefs.cookingTime} onChange={(cookingTime) => patch({ cookingTime })} />}
            {field === 'avoidedIngredients' && (
              <AvoidedIngredientsField value={prefs.avoidedIngredients} onChange={(avoidedIngredients) => patch({ avoidedIngredients })} />
            )}
          </div>
        ))}
      </div>
    </Sheet>
  )
}
