import type { ShoppingListItem } from '../types'

/**
 * Case-insensitive match against pending (not yet purchased) shopping-list
 * items — shared by every "add missing ingredients to Shopping List" call
 * site so they never create a duplicate row for something already queued.
 */
export const isAlreadyOnShoppingList = (shoppingList: ShoppingListItem[], name: string): boolean =>
  shoppingList.some((item) => !item.purchased && item.name.trim().toLowerCase() === name.trim().toLowerCase())
