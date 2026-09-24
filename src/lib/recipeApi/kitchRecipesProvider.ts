import { supabase } from '../supabase'
import i18n from '../../i18n'
import type { Database, RecipeIngredientRow } from '../database.types'
import type { ApiRecipe, MealType, RecipeIngredient } from '../../types/recipe'
import type { RecipeProvider } from './provider'

type RecipeRow = Database['public']['Tables']['recipes']['Row']

/**
 * The curated catalog is small (dozens of rows), so the whole table is fetched once and cached —
 * never re-fetched per search/lookup, and never filtered server-side. Caching the RAW rows (not
 * already-localized ApiRecipe objects) means a language change mid-session picks up the new
 * language immediately on the next call, with no new network request needed.
 */
let cachedRows: RecipeRow[] | null = null
let inFlight: Promise<RecipeRow[]> | null = null

const fetchAllRows = async (): Promise<RecipeRow[]> => {
  const { data, error } = await supabase.from('recipes').select('*').order('created_at')
  if (error) throw error
  return data ?? []
}

const getRows = async (): Promise<RecipeRow[]> => {
  if (cachedRows) return cachedRows
  if (!inFlight) {
    inFlight = fetchAllRows().then((rows) => {
      cachedRows = rows
      inFlight = null
      return rows
    })
  }
  return inFlight
}

/** i18n.language is always resolved to a concrete 'en' | 'nb' at runtime (see useLanguageSync.ts) — 'en' is the documented fallback. */
const activeLanguage = (): 'en' | 'nb' => (i18n.language === 'nb' ? 'nb' : 'en')

/** Exported for unit testing (pure, no network) — see kitchRecipesProvider.test.ts. */
export const normalizeIngredient = (row: RecipeIngredientRow, lang: 'en' | 'nb'): RecipeIngredient => ({
  name: row.canonical_name,
  displayName: lang === 'nb' ? row.name_nb : row.name_en,
  measure: (lang === 'nb' ? row.measure_nb : row.measure_en) ?? undefined,
})

/** Exported for unit testing (pure, no network) — see kitchRecipesProvider.test.ts. */
export const normalizeRecipe = (row: RecipeRow, lang: 'en' | 'nb'): ApiRecipe => ({
  id: row.id,
  title: lang === 'nb' ? row.title_nb : row.title_en,
  category: row.category ?? undefined,
  instructions: (lang === 'nb' ? row.instructions_nb : row.instructions_en) ?? undefined,
  ingredients: row.ingredients.map((ing) => normalizeIngredient(ing, lang)),
  isVegetarian: row.is_vegetarian,
  mealType: row.meal_type as MealType[],
  sourceUrl: row.source_url ?? undefined,
})

export const kitchRecipesProvider: RecipeProvider = {
  async getAllRecipes() {
    const rows = await getRows()
    const lang = activeLanguage()
    return rows.map((row) => normalizeRecipe(row, lang))
  },

  async searchByName(query) {
    const rows = await getRows()
    const lang = activeLanguage()
    const q = query.trim().toLowerCase()
    if (!q) return []
    // Matches against both languages' titles regardless of the active display language, so
    // search still finds a recipe typed in the "other" language's spelling.
    const matches = rows.filter((row) => row.title_en.toLowerCase().includes(q) || row.title_nb.toLowerCase().includes(q))
    return matches.map((row) => normalizeRecipe(row, lang))
  },

  async getById(id) {
    const rows = await getRows()
    const row = rows.find((r) => r.id === id)
    return row ? normalizeRecipe(row, activeLanguage()) : null
  },
}
