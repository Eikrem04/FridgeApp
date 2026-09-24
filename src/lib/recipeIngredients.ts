import type { InventoryItem } from '../types'
import type { ApiRecipe, RecipeIngredient, RecipeMatch } from '../types/recipe'
import { classifyRecipe } from './recipeClassification'

/** Descriptive words that don't help decide whether an ingredient is "the same thing" as an inventory item. */
const FILLER_WORDS = new Set([
  'chopped', 'fresh', 'large', 'small', 'medium', 'diced', 'sliced', 'minced', 'ground',
  'fine', 'finely', 'coarse', 'coarsely', 'ripe', 'raw', 'cooked', 'dried', 'grated',
  'crushed', 'whole', 'plain', 'extra', 'virgin', 'pinch', 'dash', 'of', 'a', 'and',
])

/** A few clearly-useful spelling/regional variants — not an ingredient ontology. */
const WORD_ALIASES: Record<string, string> = {
  aubergine: 'eggplant',
  courgette: 'zucchini',
  coriander: 'cilantro',
  capsicum: 'pepper',
  peppers: 'pepper',
  prawn: 'shrimp',
  prawns: 'shrimp',
  scallion: 'onion',
  scallions: 'onion',
  garbanzo: 'chickpea',
  garbanzos: 'chickpea',
}

const stripPlural = (word: string): string => {
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`
  if (word.length > 4 && (word.endsWith('shes') || word.endsWith('ches') || word.endsWith('xes'))) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

const canonicalWord = (word: string): string => WORD_ALIASES[word] ?? word

/** lowercase, strip punctuation/parentheticals, split into words, drop filler words, normalize plural + a few aliases. */
export const significantWords = (raw: string): string[] =>
  raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !FILLER_WORDS.has(w))
    .map(stripPlural)
    .map(canonicalWord)

const wordSetMatches = (targetWords: Set<string>, candidateWords: Set<string>): boolean => {
  if (targetWords.size === 0 || candidateWords.size === 0) return false
  const targetArr = Array.from(targetWords)
  const candidateArr = Array.from(candidateWords)
  const allTargetInCandidate = targetArr.every((w) => candidateWords.has(w))
  const allCandidateInTarget = candidateArr.every((w) => targetWords.has(w))
  return allTargetInCandidate || allCandidateInTarget
}

/** Distinct inventory item names, case-insensitively deduplicated. */
export const uniqueItemNames = (items: InventoryItem[]): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const key = item.name.trim().toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push(item.name)
    }
  }
  return out
}

const ingredientIsOwned = (ingredientName: string, ownedWordSets: Set<string>[]): boolean => {
  const ingredientWords = new Set(significantWords(ingredientName))
  return ownedWordSets.some((owned) => wordSetMatches(ingredientWords, owned))
}

/** Computes have/missing/score for one recipe against the given owned & "use soon" inventory item names. */
export const computeRecipeMatch = (recipe: ApiRecipe, ownedNames: string[], useSoonNames: string[]): RecipeMatch => {
  const ownedWordSets = ownedNames.map((name) => new Set(significantWords(name)))
  const useSoonWordSets = useSoonNames.map((name) => new Set(significantWords(name)))

  const matched: RecipeIngredient[] = []
  const missing: RecipeIngredient[] = []
  let usesSoonCount = 0

  for (const ingredient of recipe.ingredients) {
    if (ingredientIsOwned(ingredient.name, ownedWordSets)) {
      matched.push(ingredient)
      if (ingredientIsOwned(ingredient.name, useSoonWordSets)) usesSoonCount += 1
    } else {
      missing.push(ingredient)
    }
  }

  const totalCount = recipe.ingredients.length
  return {
    recipe,
    matched,
    missing,
    matchCount: matched.length,
    totalCount,
    score: totalCount === 0 ? 0 : matched.length / totalCount,
    usesSoonCount,
    mealClass: classifyRecipe(recipe),
  }
}
