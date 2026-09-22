import { supabase } from './supabase'

export interface ProductInfo {
  barcode: string
  name: string
  brand?: string
  imageUrl?: string
  /**
   * Open Food Facts' free-text package-size string (e.g. "300 g", "1 l"),
   * shown to the user as-is for reference only. This describes how big ONE
   * package is — it is NOT how many of them Kitchen has, and must never be
   * written into an item's countable `quantity`/`unit` fields (those always
   * default to 1 / "pcs" for a scanned product; see AddItem.tsx).
   */
  packageSize?: string
  /** Already-resolved Kitchen category id (comes from a previous cache hit). */
  categoryId?: string
  /** Raw Open Food Facts category tags, to be resolved against live categories. */
  categoryTags?: string[]
  source: 'openfoodfacts' | 'cache'
}

export type ProductLookupState =
  | { status: 'found'; barcode: string; product: ProductInfo }
  | { status: 'not-found'; barcode: string }
  | { status: 'error'; barcode: string; reason: 'http' | 'timeout' | 'network'; httpStatus?: number }

const OFF_TIMEOUT_MS = 8000

/**
 * Open Food Facts' `quantity` field is free text describing one package
 * (e.g. "300 g", "1 l", "6x25cl") — shown to the user verbatim, never
 * parsed into a Kitchen unit. Only accepted when it actually contains a
 * digit, which also guards against a `known_products` row cached by an
 * older build of Kitchen that stored a bare normalized unit letter (e.g.
 * "g") in this same column — those no longer resemble a real package size
 * and are dropped here rather than displayed or reused.
 */
const sanitizePackageSize = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim()
  if (!trimmed || !/\d/.test(trimmed)) return undefined
  return trimmed
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
      return { status: 'error', barcode, reason: 'http', httpStatus: res.status }
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
      packageSize: sanitizePackageSize(data.product.quantity),
      categoryTags: data.product.categories_tags,
      source: 'openfoodfacts',
    }
    return { status: 'found', barcode, product }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 'error', barcode, reason: 'timeout' }
    }
    return { status: 'error', barcode, reason: 'network' }
  } finally {
    clearTimeout(timeout)
  }
}

interface KnownProductRow {
  name: string
  brand: string | null
  category_id: string | null
  /** Column name predates this fix — holds the package-size string now, see `ProductInfo.packageSize`. */
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
      packageSize: sanitizePackageSize(data.unit),
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
        unit: product.packageSize ?? null,
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
