import { describe, expect, it } from 'vitest'
import { computeRecipeMatch } from './recipeIngredients'
import type { ApiRecipe } from '../types/recipe'

const recipe = (overrides: Partial<ApiRecipe> = {}): ApiRecipe => ({
  id: '1',
  title: 'Test Recipe',
  ingredients: [],
  ...overrides,
})

describe('computeRecipeMatch word-boundary safety', () => {
  it('does not treat "eggplant" as owned when the user only owns "egg"', () => {
    const match = computeRecipeMatch(recipe({ ingredients: [{ name: 'eggplant' }] }), ['egg'], [])
    expect(match.matched).toEqual([])
    expect(match.missing).toEqual([{ name: 'eggplant' }])
  })

  it('does not treat "egg" as owned when the user only owns "eggplant"', () => {
    const match = computeRecipeMatch(recipe({ ingredients: [{ name: 'egg' }] }), ['eggplant'], [])
    expect(match.matched).toEqual([])
  })
})

describe('computeRecipeMatch matched/missing/counts', () => {
  it('splits ingredients into matched vs missing and computes counts + score', () => {
    const match = computeRecipeMatch(
      recipe({ ingredients: [{ name: 'chicken' }, { name: 'garlic' }, { name: 'cream' }] }),
      ['chicken', 'garlic'],
      [],
    )
    expect(match.matched.map((i) => i.name).sort()).toEqual(['chicken', 'garlic'])
    expect(match.missing).toEqual([{ name: 'cream' }])
    expect(match.matchCount).toBe(2)
    expect(match.totalCount).toBe(3)
    expect(match.score).toBeCloseTo(2 / 3)
  })

  it('scores 0 for a recipe with no parsed ingredients rather than dividing by zero', () => {
    const match = computeRecipeMatch(recipe({ ingredients: [] }), ['chicken'], [])
    expect(match.score).toBe(0)
    expect(match.totalCount).toBe(0)
  })

  it('matches a multi-word inventory item against a multi-word ingredient (e.g. "chicken breast")', () => {
    const match = computeRecipeMatch(
      recipe({ ingredients: [{ name: 'chicken breast fillets' }] }),
      ['chicken breast'],
      [],
    )
    expect(match.matchCount).toBe(1)
  })
})

describe('computeRecipeMatch use-soon boost counting', () => {
  it('counts a matched ingredient as "uses soon" only when it also appears in the use-soon set', () => {
    const match = computeRecipeMatch(
      recipe({ ingredients: [{ name: 'chicken' }, { name: 'garlic' }] }),
      ['chicken', 'garlic'],
      ['chicken'],
    )
    expect(match.usesSoonCount).toBe(1)
  })

  it('does not count a missing (not owned) ingredient toward use-soon even if it is in the use-soon list', () => {
    const match = computeRecipeMatch(recipe({ ingredients: [{ name: 'cream' }] }), [], ['cream'])
    expect(match.usesSoonCount).toBe(0)
  })
})

describe('computeRecipeMatch mealClass classification pass-through', () => {
  it('attaches the classified mealClass from the recipe category', () => {
    const match = computeRecipeMatch(recipe({ category: 'Dessert', ingredients: [] }), [], [])
    expect(match.mealClass).toBe('dessert')
  })
})
