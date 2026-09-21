import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Barcode, Loader2, PackageSearch, Refrigerator, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToastStore } from '../store/useToastStore'
import { TopBar } from '../components/layout/TopBar'
import { ItemForm, type ItemFormValues } from '../components/inventory/ItemForm'
import { getFrequentItems, type FrequentEntry } from '../lib/inventory'
import { CategoryIcon } from '../lib/icons'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { getCachedProduct, cacheKnownProduct, lookupProductByBarcode, type ProductInfo } from '../lib/productLookup'
import { guessCategoryIdFromTags } from '../lib/productCategoryMap'

// The scanner pulls in the zxing barcode library, which is only needed once
// someone actually taps "Scan barcode" — loading it lazily keeps it out of
// the main bundle for everyone else.
const BarcodeScanner = lazy(() => import('../components/inventory/BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })))

type LookupState =
  | { status: 'idle' }
  | { status: 'looking-up'; barcode: string }
  | { status: 'found'; barcode: string; product: ProductInfo }
  | { status: 'not-found'; barcode: string }
  | { status: 'error'; barcode: string; message: string }

export const AddItem = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const userId = useStore((s) => s.userId)
  const storageUnits = useStore((s) => s.storageUnits)
  const categories = useStore((s) => s.categories)
  const items = useStore((s) => s.items)
  const addItem = useStore((s) => s.addItem)
  const statEvents = useStore((s) => s.statEvents)
  const showToast = useToastStore((s) => s.show)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerLoaded, setScannerLoaded] = useState(false)
  const [prefill, setPrefill] = useState<Partial<ItemFormValues>>({})
  const [formKey, setFormKey] = useState(0)
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' })

  const presetStorageId = params.get('storage') || storageUnits[0]?.id

  const frequent = useMemo(() => getFrequentItems(statEvents, items, 8), [statEvents, items])

  // A frequent item's remembered category/storage may reference a category or
  // storage unit that's since been deleted — fall back rather than submitting
  // a stale id that no longer exists.
  const applyFrequentEntry = (entry: FrequentEntry) => {
    const storageId =
      entry.storageId && storageUnits.some((u) => u.id === entry.storageId) ? entry.storageId : presetStorageId
    const categoryId =
      entry.categoryId && categories.some((c) => c.id === entry.categoryId) ? entry.categoryId : undefined
    setLookup({ status: 'idle' })
    setPrefill({
      name: entry.name,
      categoryId,
      unit: entry.unit,
      quantity: entry.quantity && entry.quantity >= 1 ? entry.quantity : undefined,
      storageId,
    })
    setFormKey((k) => k + 1)
  }

  const fallbackCategoryId = () =>
    categories.find((c) => c.name.toLowerCase() === 'other')?.id ?? categories[0]?.id ?? undefined

  const applyProduct = (product: ProductInfo) => {
    const categoryId =
      (product.categoryId && categories.some((c) => c.id === product.categoryId) ? product.categoryId : undefined) ??
      guessCategoryIdFromTags(product.categoryTags, categories) ??
      fallbackCategoryId()
    setPrefill({
      name: product.name,
      categoryId,
      unit: product.unit,
      storageId: presetStorageId,
      imageUrl: product.imageUrl,
    })
    setFormKey((k) => k + 1)
    return categoryId
  }

  const runLookup = async (barcode: string) => {
    setLookup({ status: 'looking-up', barcode })
    setPrefill({ name: '', storageId: presetStorageId })
    setFormKey((k) => k + 1)

    const cached = userId ? await getCachedProduct(userId, barcode) : null
    if (cached) {
      applyProduct(cached)
      setLookup({ status: 'found', barcode, product: cached })
      return
    }

    const result = await lookupProductByBarcode(barcode)
    if (result.status === 'found') {
      const categoryId = applyProduct(result.product)
      setLookup({ status: 'found', barcode, product: result.product })
      if (userId) void cacheKnownProduct(userId, result.product, categoryId)
      return
    }

    if (result.status === 'not-found') {
      setPrefill({ name: '', storageId: presetStorageId })
      setFormKey((k) => k + 1)
      setLookup({ status: 'not-found', barcode })
      return
    }

    // Network/timeout error — never blocks manual entry.
    setPrefill({ name: '', storageId: presetStorageId })
    setFormKey((k) => k + 1)
    setLookup({ status: 'error', barcode, message: result.message })
  }

  if (storageUnits.length === 0) {
    return (
      <div className="pb-28 md:pb-12">
        <TopBar title="Add item" />
        <div className="px-5 md:px-8">
          <EmptyState
            icon={<Refrigerator size={26} />}
            title="Add a fridge or freezer first"
            subtitle="You'll need at least one storage unit before adding items."
            action={<Button onClick={() => navigate('/settings')}>Set up storage</Button>}
          />
        </div>
      </div>
    )
  }

  const handleSubmit = async (values: ItemFormValues) => {
    const { merged, item } = await addItem(values)
    showToast(merged ? `Combined with existing ${item.name}` : `${item.name} added`)
    navigate(`/storage/${values.storageId}`)
  }

  return (
    <div className="pb-28 md:pb-12">
      <TopBar title="Add item" />
      <div className="px-5 md:px-8">
        <button
          type="button"
          onClick={() => {
            setScannerLoaded(true)
            setScannerOpen(true)
          }}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-black/[0.05] py-3.5 text-[14.5px] font-semibold text-[var(--color-ink)] transition active:scale-[0.98] dark:bg-white/10"
        >
          <Barcode size={18} />
          Scan barcode
        </button>

        {lookup.status !== 'idle' && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-black/[0.04] px-4 py-3 dark:bg-white/[0.06]">
            {lookup.status === 'looking-up' && (
              <>
                <Loader2 size={18} className="shrink-0 animate-spin text-[var(--color-ink-dim)]" />
                <p className="flex-1 text-[13.5px] font-medium text-[var(--color-ink-dim)]">Looking up product…</p>
              </>
            )}
            {lookup.status === 'found' && (
              <>
                <PackageSearch size={18} className="shrink-0 text-[var(--color-accent)]" />
                <p className="flex-1 text-[13.5px] font-medium text-[var(--color-ink)]">
                  Filled in from {lookup.product.source === 'cache' ? 'a product you scanned before' : 'Open Food Facts'} —
                  double-check before saving.
                </p>
              </>
            )}
            {lookup.status === 'not-found' && (
              <>
                <PackageSearch size={18} className="shrink-0 text-[var(--color-ink-faint)]" />
                <p className="flex-1 text-[13.5px] font-medium text-[var(--color-ink-dim)]">
                  Barcode {lookup.barcode} isn't in Open Food Facts yet — enter the product below.
                </p>
              </>
            )}
            {lookup.status === 'error' && (
              <>
                <PackageSearch size={18} className="shrink-0 text-[var(--color-ink-faint)]" />
                <p className="flex-1 text-[13.5px] font-medium text-[var(--color-ink-dim)]">
                  {lookup.message} You can still enter the product below.
                </p>
              </>
            )}
            <button
              type="button"
              onClick={() => setLookup({ status: 'idle' })}
              aria-label="Dismiss"
              className="shrink-0 rounded-full p-1 text-[var(--color-ink-faint)]"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {frequent.length > 0 && (
          <div className="mb-6">
            <p className="mb-2.5 px-1 text-[13px] font-semibold text-[var(--color-ink-dim)]">Frequently added</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {frequent.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => applyFrequentEntry(f)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/[0.05] px-3.5 py-2 text-[13.5px] font-semibold text-[var(--color-ink)] dark:bg-white/10"
                >
                  <CategoryIcon name="Star" size={13} />
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <ItemForm
          key={formKey}
          initial={{ storageId: presetStorageId, ...prefill }}
          submitLabel="Add item"
          onSubmit={handleSubmit}
        />
      </div>

      {scannerLoaded && (
        <Suspense fallback={null}>
          <BarcodeScanner
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onDetected={(barcode) => {
              setScannerOpen(false)
              void runLookup(barcode)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
