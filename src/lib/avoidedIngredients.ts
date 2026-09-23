import type { ApiRecipe, RecipeIngredient } from '../types/recipe'
import { significantWords } from './recipeIngredients'

/**
 * SAFETY: TheMealDB's ingredient list is free text from a public recipe
 * database, not a verified allergen database. This module can only ever
 * flag/exclude recipes based on the ingredient names TheMealDB happens to
 * list — it must never be used to claim a recipe IS allergy-safe, only that
 * a listed ingredient text did or didn't match. Callers must always show
 * the "verify labels yourself" disclaimer alongside any warning built from
 * this module's output (see recipes.json's `avoided.disclaimer`).
 */

export type AvoidedPresetKey = 'peanuts' | 'treeNuts' | 'milk' | 'egg' | 'fish' | 'shellfish' | 'soy' | 'wheatGluten' | 'sesame'

export const AVOIDED_PRESET_KEYS: AvoidedPresetKey[] = [
  'peanuts',
  'treeNuts',
  'milk',
  'egg',
  'fish',
  'shellfish',
  'soy',
  'wheatGluten',
  'sesame',
]

/**
 * Alias terms for each preset — kept moderate and readable, not an
 * exhaustive allergen ontology. Plurals are handled automatically by
 * significantWords (e.g. "almonds" already matches the "almond" alias), so
 * only singular forms are listed here.
 */
const PRESET_ALIASES: Record<AvoidedPresetKey, string[]> = {
  peanuts: ['peanut', 'groundnut', 'peanut butter'],
  treeNuts: ['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'brazil nut', 'pine nut', 'nut'],
  milk: ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt', 'whey', 'buttermilk'],
  egg: ['egg'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'haddock', 'mackerel', 'sardine', 'trout'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'clam', 'scallop', 'oyster', 'squid'],
  soy: ['soy', 'soya', 'tofu', 'edamame'],
  wheatGluten: ['wheat', 'flour', 'bread', 'pasta', 'spaghetti', 'gluten', 'noodle'],
  sesame: ['sesame', 'tahini'],
}

export const isAvoidedPresetKey = (value: string): value is AvoidedPresetKey =>
  (AVOIDED_PRESET_KEYS as string[]).includes(value)

/** Expands one stored avoided-ingredient entry (a preset key, or free-typed custom text) into the literal terms to match. */
const termsFor = (entry: string): string[] => (isAvoidedPresetKey(entry) ? PRESET_ALIASES[entry] : [entry])

/**
 * "milk" and "butter" are the two Milk/dairy alias words ambiguous enough to
 * false-positive on plant-based compounds ("coconut milk", "peanut butter").
 * Every other alias (cream, cheese, yogurt, whey, buttermilk, ...) is left
 * alone — this exception is narrowly scoped to just these two words.
 */
const AMBIGUOUS_MILK_BUTTER_WORDS = new Set(['milk', 'butter'])

/**
 * Small, explicit list of known non-dairy "X milk" / "X butter" phrases.
 * Kept short and readable on purpose, not a general ontology — the point is
 * only to stop "milk"/"butter" from wrongly flagging Milk/dairy here. Each
 * phrase's own ingredient (almond, peanut, soy, ...) still matches its own
 * preset normally and independently of this list.
 */
const MILK_BUTTER_EXCEPTIONS: Set<string>[] = [
  'coconut milk', 'almond milk', 'oat milk', 'soy milk', 'soya milk', 'rice milk',
  'peanut butter', 'almond butter', 'cashew butter', 'hazelnut butter', 'sunflower seed butter', 'sesame butter',
].map((phrase) => new Set(significantWords(phrase)))

const isKnownMilkButterException = (ingredientWords: Set<string>): boolean =>
  MILK_BUTTER_EXCEPTIONS.some((exceptionWords) => Array.from(exceptionWords).every((w) => ingredientWords.has(w)))

/**
 * A term matches an ingredient only if every one of the term's words appears
 * as a WHOLE word in the ingredient's normalized word set — never a raw
 * substring. This is what keeps "egg" from matching "eggplant" and "nut"
 * from matching unrelated words like "coconut": significantWords() splits
 * "eggplant"/"coconut" into a single token, which is never equal to the
 * token "egg" or "nut". The one narrow exception is the ambiguous milk/
 * butter words above, which are suppressed for known plant-based phrases.
 */
const termMatchesIngredient = (term: string, ingredientWords: Set<string>): boolean => {
  const termWords = significantWords(term)
  if (termWords.length === 0) return false
  if (termWords.length === 1 && AMBIGUOUS_MILK_BUTTER_WORDS.has(termWords[0]) && isKnownMilkButterException(ingredientWords)) {
    return false
  }
  return termWords.every((w) => ingredientWords.has(w))
}

/** Returns the subset of this recipe's ingredients whose listed text matches one of the user's avoided terms. */
export const findAvoidedIngredients = (recipe: Pick<ApiRecipe, 'ingredients'>, avoided: string[]): RecipeIngredient[] => {
  if (avoided.length === 0) return []
  const terms = avoided.flatMap(termsFor).filter((t) => t.trim().length > 0)
  if (terms.length === 0) return []
  return recipe.ingredients.filter((ingredient) => {
    const ingredientWords = new Set(significantWords(ingredient.name))
    return terms.some((term) => termMatchesIngredient(term, ingredientWords))
  })
}

export const recipeContainsAvoidedIngredient = (recipe: Pick<ApiRecipe, 'ingredients'>, avoided: string[]): boolean =>
  findAvoidedIngredients(recipe, avoided).length > 0
