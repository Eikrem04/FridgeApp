import { supabase } from './supabase'

export interface ProductInfo {
  barcode: string
  name: string
  brand?: string
  imageUrl?: string
  unit?: string
  /** Already-resolved Kitchen category id (comes from a previous cache hit). */
  categoryId?: string
  /** Raw Open Food Facts category tags, to be resolved against live categories. */
  categoryTags?: string[]
  source: 'openfoodfacts' | 'cache'
}

export type ProductLookupState =
  | { status: 'found'; barcode: string; product: ProductInfo }
  | { status: 'not-found'; barcode: string }
  | { status: 'error'; barcode: string; message: string }

const OFF_TIMEOUT_MS = 8000

/**
 * Best-effort, conservative parse of Open Food Facts' free-text `quantity`
 * field (e.g. "1 l", "500 g", "6x25cl") into one of Kitchen's own units.
 * Only ever returns a value it's confident about — a multipack like "6x25cl"
 * or an unrecognized word correctly yields undefined rather than a guess.
 */
const parseUnitFromQuantity = (quantity: string | undefined): string | undefined => {
  if (!quantity) return undefined
  const match = quantity
    .toLowerCase()
    .match(/\d[\d.,]*\s*(kg|g|ml|l|kilograms?|liters?|litres?|milliliters?|millilitres?)(?![a-z])/)
  if (!match) return undefined
  const raw = match[1]
  if (raw.startsWith('kg') || raw.startsWith('kilogram')) return 'kg'
  if (raw.startsWith('ml') || raw.startsWith('millilit')) return 'ml'
  if (raw.startsWith('l') || raw.startsWith('lit')) return 'l'
  if (raw.startsWith('g')) return 'g'
  return undefined
}

interface OffProductResponse {
  status?: number
  product?: {
    product_name?: string
    brands?: string
    image_front_url?: string
    image_url?: string
    quantity?: string
    categories_tags?: string[]
  }
}

/**
 * Looks up a barcode against the free, public Open Food Facts database.
 * Never throws — every outcome (found / not found / network or timeout
 * error) is expressed in the returned state so callers can always fall
 * back to manual entry.
 */
export const lookupProductByBarcode = async (barcode: string): Promise<ProductLookupState> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OFF_TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=status,product_name,brands,image_front_url,image_url,quantity,categories_tags`,
      { signal: controller.signal },
    )
    if (!res.ok) {
      return { status: 'error', barcode, message: `Product database returned an error (${res.status}).` }
    }
    const data = (await res.json()) as OffProductResponse
    const name = data.product?.product_name?.trim()
    if (data.status !== 1 || !data.product || !name) {
      return { status: 'not-found', barcode }
    }
    const product: ProductInfo = {
      barcode,
      name,
      brand: data.product.brands?.trim() || undefined,
      imageUrl: data.product.image_front_url || data.product.image_url || undefined,
      unit: parseUnitFromQuantity(data.product.quantity),
      categoryTags: data.product.categories_tags,
      source: 'openfoodfacts',
    }
    return { status: 'found', barcode, product }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 'error', barcode, message: 'Product lookup timed out.' }
    }
    return { status: 'error', barcode, message: "Couldn't reach the product database." }
  } finally {
    clearTimeout(timeout)
  }
}

interface KnownProductRow {
  name: string
  brand: string | null
  category_id: string | null
  unit: string | null
  image_url: string | null
}

/**
 * A missing-table (42P01) or permission (42501) error means the optional
 * `known_products` migration hasn't been applied yet — that's expected and
 * fine, the cache is a pure performance/reuse optimization, never required.
 */
const isMissingCacheTable = (error: { code?: string } | null): boolean =>
  error?.code === '42P01' || error?.code === '42501'

/** Checks whether Kitchen has already seen this barcode for this user. */
export const getCachedProduct = async (userId: string, barcode: string): Promise<ProductInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('known_products')
      .select('name, brand, category_id, unit, image_url')
      .eq('user_id', userId)
      .eq('barcode', barcode)
      .maybeSingle<KnownProductRow>()
    if (error) {
      if (!isMissingCacheTable(error)) console.warn('[Kitchen] known_products lookup failed', error)
      return null
    }
    if (!data) return null
    return {
      barcode,
      name: data.name,
      brand: data.brand ?? undefined,
      categoryId: data.category_id ?? undefined,
      unit: data.unit ?? undefined,
      imageUrl: data.image_url ?? undefined,
      source: 'cache',
    }
  } catch (err) {
    console.warn('[Kitchen] known_products lookup failed', err)
    return null
  }
}

/**
 * Best-effort write-through cache so a repeat scan of the same barcode can
 * skip Open Food Facts entirely next time. Fire-and-forget from the
 * caller's perspective — failures (including the table not existing yet)
 * are swallowed since this is purely an optimization.
 */
export const cacheKnownProduct = async (
  userId: string,
  product: ProductInfo,
  categoryId: string | undefined,
): Promise<void> => {
  try {
    const { error } = await supabase.from('known_products').upsert(
      {
        user_id: userId,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand ?? null,
        category_id: categoryId ?? null,
        unit: product.unit ?? null,
        image_url: product.imageUrl ?? null,
        source: 'openfoodfacts',
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,barcode' },
    )
    if (error && !isMissingCacheTable(error)) {
      console.warn('[Kitchen] failed to cache scanned product', error)
    }
  } catch (err) {
    console.warn('[Kitchen] failed to cache scanned product', err)
  }
}
