import { describe, expect, it } from 'vitest'
import { normalizeIngredient, normalizeRecipe } from './kitchRecipesProvider'
import type { Database, RecipeIngredientRow } from '../database.types'

type RecipeRow = Database['public']['Tables']['recipes']['Row']

const row = (overrides: Partial<RecipeRow> = {}): RecipeRow => ({
  id: 'r1',
  slug: 'test-recipe',
  title_en: 'Fish Cakes with Mashed Potatoes',
  title_nb: 'Fiskekaker med potetmos',
  meal_type: ['dinner'],
  category: 'Norwegian',
  is_vegetarian: false,
  ingredients: [
    { canonical_name: 'fish cakes', name_en: 'Fish cakes', name_nb: 'Fiskekaker', measure_en: '8', measure_nb: '8' },
    { canonical_name: 'potato', name_en: 'Potato', name_nb: 'Potet', measure_en: '800 g', measure_nb: '800 g' },
  ],
  instructions_en: 'Boil the potatoes and mash them.',
  instructions_nb: 'Kok potetene og mos dem.',
  source_url: null,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('normalizeRecipe — language selection', () => {
  it('picks the English title/instructions in English', () => {
    const recipe = normalizeRecipe(row(), 'en')
    expect(recipe.title).toBe('Fish Cakes with Mashed Potatoes')
    expect(recipe.instructions).toBe('Boil the potatoes and mash them.')
  })

  it('picks the Norwegian title/instructions in Norwegian', () => {
    const recipe = normalizeRecipe(row(), 'nb')
    expect(recipe.title).toBe('Fiskekaker med potetmos')
    expect(recipe.instructions).toBe('Kok potetene og mos dem.')
  })

  it('carries the canonical (English) ingredient name unchanged regardless of active language, for matching', () => {
    const en = normalizeRecipe(row(), 'en')
    const nb = normalizeRecipe(row(), 'nb')
    expect(en.ingredients.map((i) => i.name)).toEqual(['fish cakes', 'potato'])
    expect(nb.ingredients.map((i) => i.name)).toEqual(['fish cakes', 'potato'])
  })

  it('carries authored fields (mealType, isVegetarian, category) unchanged regardless of language', () => {
    const en = normalizeRecipe(row(), 'en')
    const nb = normalizeRecipe(row(), 'nb')
    expect(en.mealType).toEqual(['dinner'])
    expect(nb.mealType).toEqual(['dinner'])
    expect(en.isVegetarian).toBe(false)
    expect(en.category).toBe('Norwegian')
    expect(nb.category).toBe('Norwegian')
  })

  it('falls back to undefined instructions/sourceUrl when the row has none, in either language', () => {
    const recipe = normalizeRecipe(row({ instructions_en: null, instructions_nb: null, source_url: null }), 'en')
    expect(recipe.instructions).toBeUndefined()
    expect(recipe.sourceUrl).toBeUndefined()
  })
})

describe('normalizeIngredient — display name vs canonical name', () => {
  const ingredientRow: RecipeIngredientRow = {
    canonical_name: 'ground beef',
    name_en: 'Ground beef',
    name_nb: 'Kjøttdeig',
    measure_en: '400 g',
    measure_nb: '400 g',
  }

  it('uses the localized display name and measure per language, while keeping the canonical name fixed', () => {
    const en = normalizeIngredient(ingredientRow, 'en')
    const nb = normalizeIngredient(ingredientRow, 'nb')
    expect(en.name).toBe('ground beef')
    expect(nb.name).toBe('ground beef')
    expect(en.displayName).toBe('Ground beef')
    expect(nb.displayName).toBe('Kjøttdeig')
  })

  it('falls back to undefined measure when the row has none in that language', () => {
    const ingredient = normalizeIngredient({ ...ingredientRow, measure_nb: null }, 'nb')
    expect(ingredient.measure).toBeUndefined()
  })
})
