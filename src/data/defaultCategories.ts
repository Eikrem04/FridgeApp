import type { Category } from '../types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'dairy', name: 'Dairy', icon: 'Milk', isCustom: false },
  { id: 'meat', name: 'Meat', icon: 'Beef', isCustom: false },
  { id: 'fish', name: 'Fish', icon: 'Fish', isCustom: false },
  { id: 'vegetables', name: 'Vegetables', icon: 'Carrot', isCustom: false },
  { id: 'fruit', name: 'Fruit', icon: 'Apple', isCustom: false },
  { id: 'bread', name: 'Bread', icon: 'Wheat', isCustom: false },
  { id: 'drinks', name: 'Drinks', icon: 'CupSoda', isCustom: false },
  { id: 'frozen', name: 'Frozen', icon: 'Snowflake', isCustom: false },
  { id: 'ready-meals', name: 'Ready meals', icon: 'UtensilsCrossed', isCustom: false },
  { id: 'sauces', name: 'Sauces', icon: 'Droplet', isCustom: false },
  { id: 'snacks', name: 'Snacks', icon: 'Cookie', isCustom: false },
  { id: 'breakfast', name: 'Breakfast', icon: 'Egg', isCustom: false },
  { id: 'other', name: 'Other', icon: 'Package', isCustom: false },
]

export const DEFAULT_UNITS: string[] = [
  'pcs',
  'cartons',
  'packs',
  'bags',
  'bottles',
  'cans',
  'jars',
  'boxes',
  'g',
  'kg',
  'ml',
  'l',
  'slices',
  'servings',
]
