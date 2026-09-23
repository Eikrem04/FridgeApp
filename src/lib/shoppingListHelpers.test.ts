import { describe, expect, it } from 'vitest'
import { isAlreadyOnShoppingList } from './shoppingListHelpers'
import type { ShoppingListItem } from '../types'

const item = (overrides: Partial<ShoppingListItem>): ShoppingListItem => ({
  id: 'i1',
  name: 'Milk',
  purchased: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

describe('isAlreadyOnShoppingList (recipe missing-ingredient dedup)', () => {
  it('matches an existing pending item case-insensitively', () => {
    const list = [item({ name: 'milk' })]
    expect(isAlreadyOnShoppingList(list, 'Milk')).toBe(true)
    expect(isAlreadyOnShoppingList(list, 'MILK')).toBe(true)
  })

  it('ignores surrounding whitespace on both sides of the comparison', () => {
    const list = [item({ name: '  Milk  ' })]
    expect(isAlreadyOnShoppingList(list, 'milk')).toBe(true)
    expect(isAlreadyOnShoppingList(list, '  milk  ')).toBe(true)
  })

  it('returns false for a name that is not on the list at all', () => {
    const list = [item({ name: 'Milk' })]
    expect(isAlreadyOnShoppingList(list, 'Eggs')).toBe(false)
  })

  it('does not count an already-purchased item as "already on the list" (it is being restocked, not queued)', () => {
    const list = [item({ name: 'Milk', purchased: true })]
    expect(isAlreadyOnShoppingList(list, 'Milk')).toBe(false)
  })

  it('so a recipe "add missing ingredients" pass only skips names that are still pending', () => {
    const list = [item({ name: 'Milk', purchased: false }), item({ id: 'i2', name: 'Eggs', purchased: true })]
    const missing = ['Milk', 'Eggs', 'Flour']
    const toAdd = missing.filter((name) => !isAlreadyOnShoppingList(list, name))
    expect(toAdd).toEqual(['Eggs', 'Flour'])
  })
})
