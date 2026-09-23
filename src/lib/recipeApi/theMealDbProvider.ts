import type { ApiRecipe, ApiRecipeSummary, RecipeIngredient } from '../../types/recipe'
import type { RecipeProvider } from './provider'
import { THE_MEAL_DB_BASE_URL } from './config'

const REQUEST_TIMEOUT_MS = 8000

/**
 * Fetches JSON honoring both a hard timeout and an external AbortSignal (so
 * callers can cancel an in-flight request — a superseded search, an unmounted
 * component — without waiting for the timeout).
 */
async function fetchJson<T>(url: string, externalSignal: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const onExternalAbort = () => controller.abort()
  if (externalSignal.aborted) controller.abort()
  else externalSignal.addEventListener('abort', onExternalAbort)
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`Recipe API error ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timeout)
    externalSignal.removeEventListener('abort', onExternalAbort)
  }
}

/** Raw TheMealDB meal object. Numbered ingredient/measure fields (1-20) are read via bracket access. */
interface RawMeal {
  idMeal: string
  strMeal: string
  strMealThumb: string | null
  strCategory: string | null
  strArea: string | null
  strInstructions: string | null
  strSource: string | null
  strYoutube: string | null
  [key: string]: string | null | undefined
}

interface RawMealSummary {
  idMeal: string
  strMeal: string
  strMealThumb: string | null
}

const normalizeIngredients = (raw: RawMeal): RecipeIngredient[] => {
  const ingredients: RecipeIngredient[] = []
  for (let i = 1; i <= 20; i++) {
    const name = raw[`strIngredient${i}`]?.trim()
    if (!name) continue
    const measure = raw[`strMeasure${i}`]?.trim()
    ingredients.push({ name, measure: measure || undefined })
  }
  return ingredients
}

const normalizeMeal = (raw: RawMeal): ApiRecipe => ({
  id: raw.idMeal,
  title: raw.strMeal,
  imageUrl: raw.strMealThumb || undefined,
  category: raw.strCategory || undefined,
  area: raw.strArea || undefined,
  instructions: raw.strInstructions?.trim() || undefined,
  ingredients: normalizeIngredients(raw),
  sourceUrl: raw.strSource || undefined,
  youtubeUrl: raw.strYoutube || undefined,
})

const normalizeSummary = (raw: RawMealSummary): ApiRecipeSummary => ({
  id: raw.idMeal,
  title: raw.strMeal,
  imageUrl: raw.strMealThumb || undefined,
})

export const theMealDbProvider: RecipeProvider = {
  async searchByName(query, signal) {
    const data = await fetchJson<{ meals: RawMeal[] | null }>(
      `${THE_MEAL_DB_BASE_URL}/search.php?s=${encodeURIComponent(query)}`,
      signal,
    )
    return (data.meals ?? []).map(normalizeMeal)
  },

  async getById(id, signal) {
    const data = await fetchJson<{ meals: RawMeal[] | null }>(
      `${THE_MEAL_DB_BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`,
      signal,
    )
    const meal = data.meals?.[0]
    return meal ? normalizeMeal(meal) : null
  },

  async searchByIngredient(ingredient, signal) {
    const data = await fetchJson<{ meals: RawMealSummary[] | null }>(
      `${THE_MEAL_DB_BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`,
      signal,
    )
    return (data.meals ?? []).map(normalizeSummary)
  },
}
