/**
 * TheMealDB's shared "1" test key — free, public, rate-limited, intended for
 * development. It must be replaced with a paid supporter key before a public
 * App Store release (TheMealDB requires this for production apps). Swap it
 * here — or, better, move recipe fetching behind a server-side proxy (e.g. a
 * Supabase Edge Function) so a paid key is never bundled into client code at
 * all. Either change is isolated to this file and theMealDbProvider.ts; the
 * rest of the app only ever sees the RecipeProvider interface.
 */
export const THE_MEAL_DB_API_KEY = '1'
export const THE_MEAL_DB_BASE_URL = `https://www.themealdb.com/api/json/v1/${THE_MEAL_DB_API_KEY}`
