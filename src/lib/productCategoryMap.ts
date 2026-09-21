import type { Category } from '../types'

/**
 * Open Food Facts category tags (with the "en:" locale prefix stripped) mapped
 * to Kitchen's own default category names. Deliberately conservative — only
 * grocery-relevant, unambiguous tags are listed. Anything not in here should
 * fall back to the user's real "Other" category rather than a guess.
 */
const OFF_TAG_TO_KITCHEN_CATEGORY: Record<string, string> = {
  dairies: 'Dairy',
  milks: 'Dairy',
  'fermented-milk-products': 'Dairy',
  yogurts: 'Dairy',
  cheeses: 'Dairy',
  creams: 'Dairy',
  butters: 'Dairy',

  meats: 'Meat',
  poultry: 'Meat',
  sausages: 'Meat',
  'cold-cuts': 'Meat',
  charcuterie: 'Meat',
  hams: 'Meat',

  fishes: 'Fish',
  seafood: 'Fish',
  'smoked-fishes': 'Fish',

  vegetables: 'Vegetables',
  'fresh-vegetables': 'Vegetables',
  'canned-vegetables': 'Vegetables',
  potatoes: 'Vegetables',

  fruits: 'Fruit',
  'fresh-fruits': 'Fruit',
  'canned-fruits': 'Fruit',

  breads: 'Bread',
  'bakery-products': 'Bread',
  viennoiseries: 'Bread',

  beverages: 'Drinks',
  waters: 'Drinks',
  sodas: 'Drinks',
  'fruit-juices': 'Drinks',
  juices: 'Drinks',
  'plant-based-beverages': 'Drinks',
  coffees: 'Drinks',
  teas: 'Drinks',
  beers: 'Drinks',
  wines: 'Drinks',

  'frozen-foods': 'Frozen',
  'ice-creams': 'Frozen',
  'frozen-desserts': 'Frozen',

  meals: 'Ready meals',
  'prepared-meals': 'Ready meals',
  'canned-meals': 'Ready meals',
  pizzas: 'Ready meals',
  sandwiches: 'Ready meals',

  sauces: 'Sauces',
  condiments: 'Sauces',
  dressings: 'Sauces',
  ketchups: 'Sauces',
  mayonnaises: 'Sauces',

  snacks: 'Snacks',
  'sweet-snacks': 'Snacks',
  'salty-snacks': 'Snacks',
  'chips-and-fries': 'Snacks',
  chocolates: 'Snacks',
  candies: 'Snacks',
  'biscuits-and-cakes': 'Snacks',

  breakfasts: 'Breakfast',
  cereals: 'Breakfast',
  'breakfast-cereals': 'Breakfast',
  eggs: 'Breakfast',
  jams: 'Breakfast',
  honeys: 'Breakfast',
}

/**
 * Resolves an Open Food Facts `categories_tags` list to one of the user's
 * *actual* categories — matched by name, never created. Tags run
 * general-to-specific (e.g. "en:dairies" then "en:yogurts"), so the list is
 * walked in reverse to prefer the most specific match. Returns undefined
 * when nothing maps confidently; callers should fall back to the user's
 * real "Other" category rather than guessing further.
 */
export const guessCategoryIdFromTags = (
  categoryTags: string[] | undefined,
  categories: Category[],
): string | undefined => {
  if (!categoryTags || categoryTags.length === 0) return undefined
  for (const tag of [...categoryTags].reverse()) {
    const clean = tag.replace(/^[a-z]{2,3}:/, '').toLowerCase()
    const kitchenName = OFF_TAG_TO_KITCHEN_CATEGORY[clean]
    if (!kitchenName) continue
    const match = categories.find((c) => c.name.toLowerCase() === kitchenName.toLowerCase())
    if (match) return match.id
  }
  return undefined
}
