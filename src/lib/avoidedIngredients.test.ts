import { describe, expect, it } from 'vitest'
import { findAvoidedIngredients, recipeContainsAvoidedIngredient } from './avoidedIngredients'
import type { RecipeIngredient } from '../types/recipe'

const recipeOf = (names: string[]) => ({ ingredients: names.map((name): RecipeIngredient => ({ name })) })

describe('avoidedIngredients word-boundary safety', () => {
  it('does not match "egg" against "eggplant"', () => {
    expect(findAvoidedIngredients(recipeOf(['eggplant']), ['egg'])).toEqual([])
  })

  it('does match "egg" against a real egg ingredient, including plurals', () => {
    expect(findAvoidedIngredients(recipeOf(['2 large eggs']), ['egg'])).toHaveLength(1)
  })

  it('does not match the treeNuts preset against "coconut" or "peanuts"', () => {
    expect(findAvoidedIngredients(recipeOf(['coconut']), ['treeNuts'])).toEqual([])
    expect(findAvoidedIngredients(recipeOf(['peanuts']), ['treeNuts'])).toEqual([])
  })

  it('does match the treeNuts preset against an actual tree nut', () => {
    expect(findAvoidedIngredients(recipeOf(['chopped walnuts']), ['treeNuts'])).toHaveLength(1)
  })
})

describe('avoidedIngredients preset aliases', () => {
  it('matches shellfish preset aliases (prawn, crab, ...)', () => {
    expect(recipeContainsAvoidedIngredient(recipeOf(['king prawns', 'rice']), ['shellfish'])).toBe(true)
    expect(recipeContainsAvoidedIngredient(recipeOf(['crab meat']), ['shellfish'])).toBe(true)
  })

  it('matches the peanuts preset via its "peanut butter" alias', () => {
    expect(recipeContainsAvoidedIngredient(recipeOf(['peanut butter']), ['peanuts'])).toBe(true)
  })

  it('supports free-typed custom avoided terms alongside presets', () => {
    expect(recipeContainsAvoidedIngredient(recipeOf(['fresh cilantro']), ['cilantro'])).toBe(true)
    expect(recipeContainsAvoidedIngredient(recipeOf(['fresh basil']), ['cilantro'])).toBe(false)
  })
})

describe('milk/butter false-positive exceptions', () => {
  const milkButterCases: [string, boolean][] = [
    ['coconut milk', false],
    ['almond milk', false],
    ['oat milk', false],
    ['soy milk', false],
    ['soya milk', false],
    ['rice milk', false],
    ['peanut butter', false],
    ['almond butter', false],
    ['cashew butter', false],
    ['hazelnut butter', false],
    // real dairy must still be flagged
    ['whole milk', true],
    ['2 tbsp butter', true],
    ['buttermilk', true],
    ['cheddar cheese', true],
  ]

  it.each(milkButterCases)('Milk/dairy preset vs "%s" -> flagged: %s', (ingredient, expected) => {
    expect(recipeContainsAvoidedIngredient(recipeOf([ingredient]), ['milk'])).toBe(expected)
  })

  it('still attributes each plant-based exception to its OWN preset', () => {
    expect(recipeContainsAvoidedIngredient(recipeOf(['almond milk']), ['treeNuts'])).toBe(true)
    expect(recipeContainsAvoidedIngredient(recipeOf(['soy milk']), ['soy'])).toBe(true)
    expect(recipeContainsAvoidedIngredient(recipeOf(['soya milk']), ['soy'])).toBe(true)
    expect(recipeContainsAvoidedIngredient(recipeOf(['peanut butter']), ['peanuts'])).toBe(true)
    expect(recipeContainsAvoidedIngredient(recipeOf(['cashew butter']), ['treeNuts'])).toBe(true)
    expect(recipeContainsAvoidedIngredient(recipeOf(['almond butter']), ['treeNuts'])).toBe(true)
  })
})

describe('findAvoidedIngredients / recipeContainsAvoidedIngredient edge cases', () => {
  it('returns no matches when no avoided ingredients are set', () => {
    expect(findAvoidedIngredients(recipeOf(['egg', 'milk']), [])).toEqual([])
  })

  it('lists every matching ingredient, not just the first', () => {
    const result = findAvoidedIngredients(recipeOf(['egg', 'milk', 'flour']), ['egg', 'milk'])
    expect(result.map((i) => i.name).sort()).toEqual(['egg', 'milk'])
  })
})
