import { describe, expect, it } from 'vitest'
import { classifyRecipe, preferenceFitLabelKey } from './recipeClassification'
import type { MealType } from '../types/recipe'

describe('classifyRecipe — authored mealType passthrough', () => {
  it('returns the recipe\'s own authored meal types unchanged', () => {
    expect(classifyRecipe({ mealType: ['breakfast'] })).toEqual(['breakfast'])
    expect(classifyRecipe({ mealType: ['lunch', 'dinner'] })).toEqual(['lunch', 'dinner'])
  })
})

describe('preferenceFitLabelKey', () => {
  it('returns null when none of the recipe\'s meal types match any selected interest', () => {
    expect(preferenceFitLabelKey(['breakfast'], ['dinner', 'lunch'])).toBeNull()
  })

  it('labels a dinner-typed recipe as a dinner match when Dinner is selected', () => {
    expect(preferenceFitLabelKey(['dinner'], ['dinner'])).toBe('match.goodDinnerMatch')
  })

  it('labels a lunch-typed recipe as a lunch match when only Lunch (not Dinner) is selected', () => {
    expect(preferenceFitLabelKey(['lunch'], ['lunch'])).toBe('match.goodLunchMatch')
  })

  it('fits a multi-meal-type recipe against whichever selected interest it satisfies', () => {
    expect(preferenceFitLabelKey(['lunch', 'dinner'], ['lunch'])).toBe('match.goodLunchMatch')
    expect(preferenceFitLabelKey(['lunch', 'dinner'], ['dinner'])).toBe('match.goodDinnerMatch')
  })

  it('prefers dinner over lunch in the label when a recipe/selection satisfies both', () => {
    const result: MealType[] = ['lunch', 'dinner']
    expect(preferenceFitLabelKey(result, ['dinner', 'lunch'])).toBe('match.goodDinnerMatch')
  })

  it('returns null for meal interests the curated catalog never authors (snacks/desserts)', () => {
    expect(preferenceFitLabelKey(['breakfast', 'lunch', 'dinner'], ['snacks'])).toBeNull()
    expect(preferenceFitLabelKey(['breakfast', 'lunch', 'dinner'], ['desserts'])).toBeNull()
  })
})
