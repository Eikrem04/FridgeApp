import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Barcode, Refrigerator } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToastStore } from '../store/useToastStore'
import { TopBar } from '../components/layout/TopBar'
import { ItemForm, type ItemFormValues } from '../components/inventory/ItemForm'
import { BarcodeScanner } from '../components/inventory/BarcodeScanner'
import { getFrequentItems, type FrequentEntry } from '../lib/inventory'
import { CategoryIcon } from '../lib/icons'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'

export const AddItem = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const storageUnits = useStore((s) => s.storageUnits)
  const categories = useStore((s) => s.categories)
  const items = useStore((s) => s.items)
  const addItem = useStore((s) => s.addItem)
  const statEvents = useStore((s) => s.statEvents)
  const showToast = useToastStore((s) => s.show)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [prefill, setPrefill] = useState<Partial<ItemFormValues>>({})
  const [formKey, setFormKey] = useState(0)

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
    setPrefill({
      name: entry.name,
      categoryId,
      unit: entry.unit,
      quantity: entry.quantity && entry.quantity >= 1 ? entry.quantity : undefined,
      storageId,
    })
    setFormKey((k) => k + 1)
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
          onClick={() => setScannerOpen(true)}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-black/[0.05] py-3.5 text-[14.5px] font-semibold text-[var(--color-ink)] transition active:scale-[0.98] dark:bg-white/10"
        >
          <Barcode size={18} />
          Scan barcode
        </button>

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

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={() => {
          setScannerOpen(false)
          setPrefill({ storageId: presetStorageId, name: '' })
          setFormKey((k) => k + 1)
          showToast('Barcode scanned — enter the product name')
        }}
      />
    </div>
  )
}
