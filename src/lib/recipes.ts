import type { InventoryItem, Recipe } from '../types'

export interface RecipeMatch {
  recipe: Recipe
  matched: string[]
  missing: string[]
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/s$/, '')

export const matchRecipes = (items: InventoryItem[], recipes: Recipe[]): RecipeMatch[] => {
  const owned = items.map((it) => normalize(it.name))

  const results: RecipeMatch[] = recipes.map((recipe) => {
    const matched: string[] = []
    const missing: string[] = []
    for (const ingredient of recipe.ingredients) {
      const norm = normalize(ingredient)
      const has = owned.some((name) => name.includes(norm) || norm.includes(name))
      if (has) matched.push(ingredient)
      else missing.push(ingredient)
    }
    return { recipe, matched, missing }
  })

  return results
    .filter((r) => r.matched.length > 0)
    .sort((a, b) => {
      if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length
      return b.matched.length - a.matched.length
    })
}
