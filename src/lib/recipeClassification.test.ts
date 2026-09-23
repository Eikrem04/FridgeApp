import { describe, expect, it } from 'vitest'
import { classifyRecipe, isVegetarianFriendly, preferenceFitLabelKey } from './recipeClassification'

describe('classifyRecipe — category is the primary signal', () => {
  it('classifies a Dessert-categorized recipe as dessert', () => {
    expect(classifyRecipe({ category: 'Dessert', title: 'Anything' })).toBe('dessert')
  })

  it('classifies meat/seafood/pasta/vegetarian categories as main', () => {
    for (const category of ['Beef', 'Chicken', 'Lamb', 'Pork', 'Goat', 'Seafood', 'Pasta', 'Vegetarian', 'Vegan']) {
      expect(classifyRecipe({ category, title: 'Anything' })).toBe('main')
    }
  })

  it('classifies Breakfast as breakfast and Side/Starter as snack', () => {
    expect(classifyRecipe({ category: 'Breakfast', title: 'Anything' })).toBe('breakfast')
    expect(classifyRecipe({ category: 'Side', title: 'Anything' })).toBe('snack')
    expect(classifyRecipe({ category: 'Starter', title: 'Anything' })).toBe('snack')
  })
})

describe('classifyRecipe — title fallback for Miscellaneous/unrecognized categories', () => {
  it('falls back to a dessert title hint when the category is Miscellaneous', () => {
    expect(classifyRecipe({ category: 'Miscellaneous', title: 'Chocolate Fudge Brownie' })).toBe('dessert')
  })

  it('falls back to a breakfast title hint', () => {
    expect(classifyRecipe({ category: 'Miscellaneous', title: 'Classic Porridge' })).toBe('breakfast')
  })

  it('returns unknown when neither category nor title gives a signal', () => {
    expect(classifyRecipe({ category: 'Miscellaneous', title: 'Hearty Beef Stew' })).toBe('unknown')
    expect(classifyRecipe({ category: undefined, title: 'Something Unusual' })).toBe('unknown')
  })
})

describe('preferenceFitLabelKey', () => {
  it('returns null for an unknown class regardless of interests', () => {
    expect(preferenceFitLabelKey('unknown', ['dinner', 'lunch', 'breakfast', 'snacks', 'desserts'])).toBeNull()
  })

  it('rejects a dessert-classified recipe when only Dinner is selected', () => {
    expect(preferenceFitLabelKey('dessert', ['dinner'])).toBeNull()
  })

  it('accepts a dessert-classified recipe once Desserts is selected', () => {
    expect(preferenceFitLabelKey('dessert', ['desserts'])).toBe('match.goodDessertMatch')
  })

  it('labels a "main" recipe as a dinner match when Dinner is selected', () => {
    expect(preferenceFitLabelKey('main', ['dinner'])).toBe('match.goodDinnerMatch')
  })

  it('labels a "main" recipe as a lunch match when only Lunch (not Dinner) is selected', () => {
    expect(preferenceFitLabelKey('main', ['lunch'])).toBe('match.goodLunchMatch')
  })
})

describe('isVegetarianFriendly', () => {
  it('excludes recipes in a definitively meat/fish category', () => {
    expect(isVegetarianFriendly({ category: 'Chicken', title: 'Roast Chicken', ingredients: [] })).toBe(false)
    expect(isVegetarianFriendly({ category: 'Seafood', title: 'Grilled Salmon', ingredients: [] })).toBe(false)
  })

  it('includes a Vegetarian-categorized recipe', () => {
    expect(isVegetarianFriendly({ category: 'Vegetarian', title: 'Veggie Pasta', ingredients: [] })).toBe(true)
  })

  it('excludes a Miscellaneous recipe that mentions a meat keyword in its ingredients', () => {
    expect(
      isVegetarianFriendly({
        category: 'Miscellaneous',
        title: 'Family Stew',
        ingredients: [{ name: 'bacon' }, { name: 'onion' }],
      }),
    ).toBe(false)
  })

  it('includes a Miscellaneous recipe with no meat signal anywhere', () => {
    expect(
      isVegetarianFriendly({
        category: 'Miscellaneous',
        title: 'Vegetable Curry',
        ingredients: [{ name: 'chickpeas' }, { name: 'spinach' }],
      }),
    ).toBe(true)
  })
})
