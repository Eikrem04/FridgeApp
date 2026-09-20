import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Barcode, Refrigerator } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToastStore } from '../store/useToastStore'
import { TopBar } from '../components/layout/TopBar'
import { ItemForm, type ItemFormValues } from '../components/inventory/ItemForm'
import { BarcodeScanner } from '../components/inventory/BarcodeScanner'
import { getFrequentItems } from '../lib/inventory'
import { CategoryIcon } from '../lib/icons'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'

export const AddItem = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const storageUnits = useStore((s) => s.storageUnits)
  const addItem = useStore((s) => s.addItem)
  const statEvents = useStore((s) => s.statEvents)
  const showToast = useToastStore((s) => s.show)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [prefillName, setPrefillName] = useState<string | undefined>(undefined)
  const [formKey, setFormKey] = useState(0)

  const presetStorageId = params.get('storage') || storageUnits[0]?.id

  const frequent = useMemo(() => getFrequentItems(statEvents, 8), [statEvents])

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

  const handleSubmit = (values: ItemFormValues) => {
    const { merged, item } = addItem(values)
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
                  onClick={() => {
                    setPrefillName(f.name)
                    setFormKey((k) => k + 1)
                  }}
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
          initial={{ storageId: presetStorageId, name: prefillName }}
          submitLabel="Add item"
          onSubmit={handleSubmit}
        />
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={() => {
          setScannerOpen(false)
          setPrefillName('')
          setFormKey((k) => k + 1)
          showToast('Barcode scanned — enter the product name')
        }}
      />
    </div>
  )
}
