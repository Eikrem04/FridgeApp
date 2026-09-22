import type { TFunction } from 'i18next'
import type { Category } from '../types'

/**
 * Maps each built-in default category's exact seeded name (always English —
 * both the `handle_new_user()` SQL trigger and the client-side "Reset all
 * data" re-seed always create these 13 names verbatim, regardless of the
 * active UI language) to its translation key.
 */
const CATEGORY_KEY_BY_NAME: Record<string, string> = {
  dairy: 'dairy',
  meat: 'meat',
  fish: 'fish',
  vegetables: 'vegetables',
  fruit: 'fruit',
  bread: 'bread',
  drinks: 'drinks',
  frozen: 'frozen',
  'ready meals': 'readyMeals',
  sauces: 'sauces',
  snacks: 'snacks',
  breakfast: 'breakfast',
  other: 'other',
}

/**
 * Display name for a category. `isCustom` is a real, reliable database
 * column (unlike storage units, categories have always tracked this) — a
 * built-in default (`isCustom: false`) is shown using the current
 * language's translated label; any user-created category is shown exactly
 * as entered, in every language, never translated or altered. The
 * database row's `name` is never written to for this purpose.
 */
export const getCategoryDisplayName = (category: Pick<Category, 'name' | 'isCustom'>, t: TFunction): string => {
  if (category.isCustom) return category.name
  const key = CATEGORY_KEY_BY_NAME[category.name.trim().toLowerCase()]
  return key ? t(`common:category.${key}`) : category.name
}
