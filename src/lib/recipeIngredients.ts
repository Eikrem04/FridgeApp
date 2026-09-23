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

/** Recognized inventory ingredient -> TheMealDB filter.php query term (verified to return results). Ordered most-specific-first. */
const KNOWN_INGREDIENTS: { aliases: string[]; query: string }[] = [
  { aliases: ['chicken breast', 'chicken breasts'], query: 'chicken_breast' },
  { aliases: ['chicken'], query: 'chicken' },
  { aliases: ['ground beef', 'minced beef'], query: 'ground_beef' },
  { aliases: ['beef'], query: 'beef' },
  { aliases: ['pork'], query: 'pork' },
  { aliases: ['bacon'], query: 'bacon' },
  { aliases: ['sausage', 'sausages'], query: 'sausages' },
  { aliases: ['salmon'], query: 'salmon' },
  { aliases: ['tuna'], query: 'tuna' },
  { aliases: ['shrimp', 'prawns', 'prawn'], query: 'prawns' },
  { aliases: ['turkey'], query: 'turkey' },
  { aliases: ['lamb'], query: 'lamb' },
  { aliases: ['ham'], query: 'ham' },
  { aliases: ['egg', 'eggs'], query: 'eggs' },
  { aliases: ['milk'], query: 'milk' },
  { aliases: ['cheddar', 'cheddar cheese'], query: 'cheddar_cheese' },
  { aliases: ['mozzarella'], query: 'mozzarella' },
  { aliases: ['parmesan'], query: 'parmesan' },
  { aliases: ['cheese'], query: 'cheese' },
  { aliases: ['butter'], query: 'butter' },
  { aliases: ['sour cream'], query: 'sour_cream' },
  { aliases: ['cream'], query: 'cream' },
  { aliases: ['yogurt', 'yoghurt'], query: 'yogurt' },
  { aliases: ['onion', 'onions'], query: 'onion' },
  { aliases: ['garlic'], query: 'garlic' },
  { aliases: ['tomato', 'tomatoes'], query: 'tomatoes' },
  { aliases: ['potato', 'potatoes'], query: 'potatoes' },
  { aliases: ['carrot', 'carrots'], query: 'carrots' },
  { aliases: ['broccoli'], query: 'broccoli' },
  { aliases: ['mushroom', 'mushrooms'], query: 'mushrooms' },
  { aliases: ['spinach'], query: 'spinach' },
  { aliases: ['bell pepper', 'pepper', 'peppers'], query: 'pepper' },
  { aliases: ['cucumber'], query: 'cucumber' },
  { aliases: ['lettuce'], query: 'lettuce' },
  { aliases: ['avocado'], query: 'avocado' },
  { aliases: ['lemon'], query: 'lemon' },
  { aliases: ['lime'], query: 'lime' },
  { aliases: ['apple', 'apples'], query: 'apples' },
  { aliases: ['banana', 'bananas'], query: 'banana' },
  { aliases: ['zucchini', 'courgette'], query: 'zucchini' },
  { aliases: ['peas'], query: 'peas' },
  { aliases: ['cabbage'], query: 'cabbage' },
  { aliases: ['kale'], query: 'kale' },
  { aliases: ['ginger'], query: 'ginger' },
  { aliases: ['chili', 'chilli', 'chile'], query: 'chilli' },
  { aliases: ['basil'], query: 'basil' },
  { aliases: ['squash'], query: 'squash' },
  { aliases: ['rice'], query: 'rice' },
  { aliases: ['pasta', 'spaghetti'], query: 'spaghetti' },
  { aliases: ['flour'], query: 'flour' },
  { aliases: ['bread'], query: 'bread' },
  { aliases: ['olive oil'], query: 'olive_oil' },
  { aliases: ['soy sauce'], query: 'soy_sauce' },
  { aliases: ['chickpeas', 'chickpea'], query: 'chickpeas' },
  { aliases: ['honey'], query: 'honey' },
  { aliases: ['oats'], query: 'oats' },
  { aliases: ['quinoa'], query: 'quinoa' },
  { aliases: ['noodles'], query: 'noodles' },
  { aliases: ['tofu'], query: 'tofu' },
  { aliases: ['cinnamon'], query: 'cinnamon' },
  { aliases: ['oregano'], query: 'oregano' },
  { aliases: ['thyme'], query: 'thyme' },
]

/** Returns a TheMealDB-queryable ingredient term if this inventory item name is recognized, else null. */
export const findQueryableIngredient = (itemName: string): string | null => {
  const itemWords = new Set(significantWords(itemName))
  if (itemWords.size === 0) return null
  for (const entry of KNOWN_INGREDIENTS) {
    if (entry.aliases.some((alias) => significantWords(alias).every((w) => itemWords.has(w)))) {
      return entry.query
    }
  }
  return null
}

/**
 * Picks up to `limit` distinct queryable ingredient terms from the user's inventory,
 * prioritizing items that are expiring soon so suggestions lean toward using them up.
 */
export const pickQueryableIngredients = (items: InventoryItem[], useSoonItems: InventoryItem[], limit: number): string[] => {
  const useSoonIds = new Set(useSoonItems.map((it) => it.id))
  const ordered = [...items].sort((a, b) => Number(useSoonIds.has(b.id)) - Number(useSoonIds.has(a.id)))
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of ordered) {
    const query = findQueryableIngredient(item.name)
    if (query && !seen.has(query)) {
      seen.add(query)
      result.push(query)
      if (result.length >= limit) break
    }
  }
  return result
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
