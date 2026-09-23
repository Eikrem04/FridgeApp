import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CookingTimePreference, DietaryPreference, HouseholdSize, InventoryImportance, MealInterest } from '../../types/recipePreferences'
import { AVOIDED_PRESET_KEYS, isAvoidedPresetKey } from '../../lib/avoidedIngredients'
import { Segmented } from '../ui/Segmented'
import { TextInput } from '../ui/Field'
import { Button } from '../ui/Button'

const MEAL_INTERESTS: MealInterest[] = ['dinner', 'lunch', 'breakfast', 'snacks', 'desserts']
const INVENTORY_IMPORTANCE_OPTIONS: InventoryImportance[] = ['inventory_first', 'balanced', 'discovery']
const HOUSEHOLD_SIZES: HouseholdSize[] = ['1', '2', '3-4', '5+']
const COOKING_TIMES: CookingTimePreference[] = ['under20', '20to40', '40to60', 'any']

interface FieldProps<T> {
  value: T
  onChange: (value: T) => void
}

export const MealInterestField = ({ value, onChange }: FieldProps<MealInterest[]>) => {
  const { t } = useTranslation('recipes')
  const toggle = (interest: MealInterest) => {
    if (value.includes(interest)) {
      // Keep at least one interest selected — an empty set would filter out every suggestion.
      if (value.length === 1) return
      onChange(value.filter((v) => v !== interest))
    } else {
      onChange([...value, interest])
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {MEAL_INTERESTS.map((interest) => {
        const selected = value.includes(interest)
        return (
          <button
            key={interest}
            type="button"
            onClick={() => toggle(interest)}
            className={`rounded-full px-4 py-2.5 text-[14.5px] font-semibold transition ${
              selected ? 'bg-[var(--color-accent)] text-white' : 'bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10'
            }`}
          >
            {t(`preferences.fields.mealInterests.${interest}`)}
          </button>
        )
      })}
    </div>
  )
}

const RadioList = <T extends string>({ options, value, onChange, labelKey }: FieldProps<T> & { options: T[]; labelKey: (opt: T) => string }) => {
  const { t } = useTranslation('recipes')
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[14.5px] font-medium transition ${
            value === opt
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'bg-black/[0.04] text-[var(--color-ink)] dark:bg-white/[0.06]'
          }`}
        >
          <span>{t(labelKey(opt))}</span>
          {value === opt && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />}
        </button>
      ))}
    </div>
  )
}

export const InventoryImportanceField = ({ value, onChange }: FieldProps<InventoryImportance>) => (
  <RadioList
    options={INVENTORY_IMPORTANCE_OPTIONS}
    value={value}
    onChange={onChange}
    labelKey={(opt) => `preferences.fields.inventoryImportance.${opt}`}
  />
)

export const CookingTimeField = ({ value, onChange }: FieldProps<CookingTimePreference>) => (
  <RadioList options={COOKING_TIMES} value={value} onChange={onChange} labelKey={(opt) => `preferences.fields.cookingTime.${opt}`} />
)

export const DietaryField = ({ value, onChange }: FieldProps<DietaryPreference>) => {
  const { t } = useTranslation('recipes')
  return (
    <Segmented<DietaryPreference>
      value={value}
      onChange={onChange}
      options={[
        { value: 'none', label: t('preferences.fields.dietary.none') },
        { value: 'vegetarian', label: t('preferences.fields.dietary.vegetarian') },
      ]}
    />
  )
}

export const HouseholdSizeField = ({ value, onChange }: FieldProps<HouseholdSize>) => {
  const { t } = useTranslation('recipes')
  return (
    <Segmented<HouseholdSize>
      value={value}
      onChange={onChange}
      options={HOUSEHOLD_SIZES.map((size) => ({ value: size, label: t(`preferences.fields.householdSize.${size}`) }))}
    />
  )
}

export const AvoidedIngredientsField = ({ value, onChange }: FieldProps<string[]>) => {
  const { t } = useTranslation(['recipes', 'common'])
  const [customInput, setCustomInput] = useState('')
  const customEntries = value.filter((v) => !isAvoidedPresetKey(v))

  const togglePreset = (preset: string) => {
    if (value.includes(preset)) onChange(value.filter((v) => v !== preset))
    else onChange([...value, preset])
  }

  const addCustom = () => {
    const trimmed = customInput.trim()
    if (!trimmed) return
    const isDuplicate = value.some((v) => v.toLowerCase() === trimmed.toLowerCase())
    if (!isDuplicate) onChange([...value, trimmed])
    setCustomInput('')
  }

  const removeEntry = (entry: string) => onChange(value.filter((v) => v !== entry))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {AVOIDED_PRESET_KEYS.map((preset) => {
          const selected = value.includes(preset)
          return (
            <button
              key={preset}
              type="button"
              onClick={() => togglePreset(preset)}
              className={`rounded-full px-4 py-2.5 text-[14.5px] font-semibold transition ${
                selected ? 'bg-[var(--color-accent)] text-white' : 'bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10'
              }`}
            >
              {t(`preferences.fields.avoidedIngredients.presets.${preset}`)}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        <TextInput
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
          placeholder={t('preferences.fields.avoidedIngredients.customPlaceholder')}
        />
        <Button size="md" onClick={addCustom} disabled={!customInput.trim()}>
          {t('common:actions.add')}
        </Button>
      </div>
      {customEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customEntries.map((entry) => (
            <span
              key={entry}
              className="flex items-center gap-1.5 rounded-full bg-black/[0.05] py-1.5 pl-3.5 pr-2 text-[13.5px] font-medium text-[var(--color-ink)] dark:bg-white/10"
            >
              {entry}
              <button
                type="button"
                onClick={() => removeEntry(entry)}
                aria-label={t('common:actions.remove')}
                className="flex h-4 w-4 items-center justify-center rounded-full text-[var(--color-ink-faint)]"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-[12.5px] text-[var(--color-ink-faint)]">{t('preferences.fields.avoidedIngredients.hint')}</p>
    </div>
  )
}
