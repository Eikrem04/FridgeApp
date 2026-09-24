import { describe, expect, it } from 'vitest'
import { rankSuggestionsByPreference } from './recipeRanking'
import { DEFAULT_RECIPE_PREFERENCES } from '../types/recipePreferences'
import type { ApiRecipe } from '../types/recipe'
import type { RecipePreferences } from '../types/recipePreferences'

const prefs = (overrides: Partial<RecipePreferences> = {}): RecipePreferences => ({
  ...DEFAULT_RECIPE_PREFERENCES,
  ...overrides,
})

const namedIngredients = (count: number, prefix = 'ingredient') =>
  Array.from({ length: count }, (_, i) => ({ name: `${prefix}${i + 1}` }))

const recipe = (overrides: Partial<ApiRecipe> & Pick<ApiRecipe, 'id' | 'title'>): ApiRecipe => ({
  ingredients: [],
  isVegetarian: false,
  mealType: ['dinner'],
  ...overrides,
})

describe('rankSuggestionsByPreference — meal-type filtering', () => {
  it('filters out a breakfast-only recipe when only Dinner is selected', () => {
    const dinnerRecipe = recipe({ id: 'dinner', title: 'Roast Chicken', mealType: ['dinner'] })
    const breakfastRecipe = recipe({ id: 'breakfast', title: 'Porridge', mealType: ['breakfast'] })

    const result = rankSuggestionsByPreference([dinnerRecipe, breakfastRecipe], [], [], prefs({ mealInterests: ['dinner'] }))

    expect(result.map((m) => m.recipe.id)).toEqual(['dinner'])
  })

  it('keeps a multi-meal-type recipe once either of its types is selected', () => {
    const lunchAndDinner = recipe({ id: 'both', title: 'Taco', mealType: ['lunch', 'dinner'] })
    const result = rankSuggestionsByPreference([lunchAndDinner], [], [], prefs({ mealInterests: ['lunch'] }))
    expect(result.map((m) => m.recipe.id)).toEqual(['both'])
  })

  it('drops every recipe when the user only selects an interest the catalog never authors (snacks/desserts)', () => {
    const dinnerRecipe = recipe({ id: 'dinner', title: 'Roast Chicken', mealType: ['dinner'] })
    const result = rankSuggestionsByPreference([dinnerRecipe], [], [], prefs({ mealInterests: ['snacks'] }))
    expect(result).toEqual([])
  })
})

describe('rankSuggestionsByPreference — inventory_first vs balanced vs discovery', () => {
  // Recipe A: lots of matches AND lots of missing (5 of 10 owned).
  // Recipe B: few matches but nothing missing (2 of 2 owned).
  const recipeA = recipe({ id: 'A', title: 'Big Recipe', ingredients: namedIngredients(10) })
  const recipeB = recipe({ id: 'B', title: 'Small Recipe', ingredients: namedIngredients(2) })
  const owned = ['ingredient1', 'ingredient2', 'ingredient3', 'ingredient4', 'ingredient5']

  it('inventory_first heavily penalizes missing ingredients — B (0 missing) beats A (5 missing) despite fewer matches', () => {
    const result = rankSuggestionsByPreference([recipeA, recipeB], owned, [], prefs({ inventoryImportance: 'inventory_first' }))
    expect(result.map((m) => m.recipe.id)).toEqual(['B', 'A'])
  })

  it('discovery barely penalizes missing ingredients — A (more raw matches) beats B despite having missing ingredients', () => {
    const result = rankSuggestionsByPreference([recipeA, recipeB], owned, [], prefs({ inventoryImportance: 'discovery' }))
    expect(result.map((m) => m.recipe.id)).toEqual(['A', 'B'])
  })

  it('the ordering genuinely flips between inventory_first and discovery for the same candidates', () => {
    const invFirst = rankSuggestionsByPreference([recipeA, recipeB], owned, [], prefs({ inventoryImportance: 'inventory_first' }))
    const discovery = rankSuggestionsByPreference([recipeA, recipeB], owned, [], prefs({ inventoryImportance: 'discovery' }))
    expect(invFirst.map((m) => m.recipe.id)).not.toEqual(discovery.map((m) => m.recipe.id))
  })
})

describe('rankSuggestionsByPreference — use-soon is a tiebreaker, not an override', () => {
  it('does not let a use-soon match override a clearly better inventory match', () => {
    // Distinct ingredient prefixes per recipe so `owned`/`useSoon` can apply asymmetrically.
    const strongMatch = recipe({ id: 'strong', title: 'Strong', ingredients: namedIngredients(5, 'strong') })
    const weakMatchUsesSoon = recipe({ id: 'weak', title: 'Weak', ingredients: namedIngredients(5, 'weak') })
    // strongMatch: owns 4 of 5, none expiring soon. weakMatchUsesSoon: owns only 1 of 5, but that 1 is expiring soon.
    const owned = ['strong1', 'strong2', 'strong3', 'strong4', 'weak1']
    const useSoon = ['weak1']

    const result = rankSuggestionsByPreference([weakMatchUsesSoon, strongMatch], owned, useSoon, prefs())
    expect(result[0].recipe.id).toBe('strong')
  })

  it('does break ties between otherwise-equal recipes in favor of the one using soon-to-expire ingredients', () => {
    const withUseSoon = recipe({ id: 'with-use-soon', title: 'A', ingredients: namedIngredients(3, 'a') })
    const withoutUseSoon = recipe({ id: 'without-use-soon', title: 'B', ingredients: namedIngredients(3, 'b') })
    // Each recipe owns exactly 1 of its own 3 ingredients — identical matchCount/missing on both
    // sides — but only the "a" recipe's matched ingredient is in the use-soon set.
    const owned = ['a1', 'b1']
    const useSoon = ['a1']

    const result = rankSuggestionsByPreference([withoutUseSoon, withUseSoon], owned, useSoon, prefs())
    expect(result[0].recipe.id).toBe('with-use-soon')
  })
})

describe('rankSuggestionsByPreference — dietary (vegetarian) filtering', () => {
  it('excludes a non-vegetarian recipe when the dietary preference is vegetarian', () => {
    const meatRecipe = recipe({ id: 'meat', title: 'Roast Chicken', isVegetarian: false })
    const veggieRecipe = recipe({ id: 'veggie', title: 'Veggie Bowl', isVegetarian: true })

    const result = rankSuggestionsByPreference([meatRecipe, veggieRecipe], [], [], prefs({ dietary: 'vegetarian' }))

    expect(result.map((m) => m.recipe.id)).toEqual(['veggie'])
  })

  it('keeps non-vegetarian recipes when the dietary preference is none', () => {
    const meatRecipe = recipe({ id: 'meat', title: 'Roast Chicken', isVegetarian: false })
    const result = rankSuggestionsByPreference([meatRecipe], [], [], prefs({ dietary: 'none' }))
    expect(result.map((m) => m.recipe.id)).toEqual(['meat'])
  })
})

describe('rankSuggestionsByPreference — avoided ingredients', () => {
  it('excludes a recipe containing an avoided ingredient from suggestions entirely', () => {
    const withEgg = recipe({ id: 'egg-recipe', title: 'Omelette', mealType: ['breakfast'], ingredients: [{ name: 'egg' }] })
    const withoutEgg = recipe({ id: 'no-egg', title: 'Porridge', mealType: ['breakfast'], ingredients: [{ name: 'oats' }] })

    const result = rankSuggestionsByPreference(
      [withEgg, withoutEgg],
      [],
      [],
      prefs({ mealInterests: ['breakfast'], avoidedIngredients: ['egg'] }),
    )

    expect(result.map((m) => m.recipe.id)).toEqual(['no-egg'])
  })

  it('never re-adds an excluded recipe even when it would otherwise be the best match', () => {
    const withEgg = recipe({ id: 'egg-recipe', title: 'Omelette', mealType: ['breakfast'], ingredients: [{ name: 'egg' }] })
    const result = rankSuggestionsByPreference(
      [withEgg],
      ['egg'],
      [],
      prefs({ mealInterests: ['breakfast'], avoidedIngredients: ['egg'] }),
    )
    expect(result).toEqual([])
  })
})
