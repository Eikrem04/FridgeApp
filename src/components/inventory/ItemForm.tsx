import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { DEFAULT_UNITS } from '../../data/defaultCategories'
import { FieldWrap, SelectInput, TextArea, TextInput } from '../ui/Field'
import { CategoryPicker } from './CategoryPicker'
import { ExpirationPicker } from './ExpirationPicker'
import { Stepper } from '../ui/Stepper'
import { Button } from '../ui/Button'

export interface ItemFormValues {
  name: string
  categoryId: string
  quantity: number
  unit: string
  storageId: string
  expirationDate: string | null
  notes: string
}

interface ItemFormProps {
  initial?: Partial<ItemFormValues>
  submitLabel: string
  onSubmit: (values: ItemFormValues) => void
  onCancel?: () => void
}

export const ItemForm = ({ initial, submitLabel, onSubmit, onCancel }: ItemFormProps) => {
  const storageUnits = useStore((s) => s.storageUnits)
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? 'other')
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1)
  const [unit, setUnit] = useState(initial?.unit ?? 'pcs')
  const [storageId, setStorageId] = useState(initial?.storageId ?? storageUnits[0]?.id ?? '')
  const [expirationDate, setExpirationDate] = useState<string | null>(initial?.expirationDate ?? null)
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const canSubmit = name.trim().length > 0 && storageId

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit) return
        onSubmit({ name: name.trim(), categoryId, quantity, unit, storageId, expirationDate, notes: notes.trim() })
      }}
      className="flex flex-col gap-5"
    >
      <FieldWrap label="Storage">
        <SelectInput value={storageId} onChange={(e) => setStorageId(e.target.value)} required>
          {storageUnits.length === 0 && <option value="">No storage units — add one first</option>}
          {storageUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </SelectInput>
      </FieldWrap>

      <FieldWrap label="Name">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Milk"
          autoFocus
          required
        />
      </FieldWrap>

      <FieldWrap label="Category">
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
      </FieldWrap>

      <div className="flex gap-4">
        <div className="flex-1">
          <FieldWrap label="Quantity">
            <div className="flex items-center rounded-2xl bg-black/[0.04] px-4 py-2.5 dark:bg-white/[0.06]">
              <Stepper value={quantity} onChange={setQuantity} min={1} size="sm" />
            </div>
          </FieldWrap>
        </div>
        <div className="flex-1">
          <FieldWrap label="Unit">
            <SelectInput value={unit} onChange={(e) => setUnit(e.target.value)}>
              {DEFAULT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </SelectInput>
          </FieldWrap>
        </div>
      </div>

      <FieldWrap label="Expiration date">
        <ExpirationPicker value={expirationDate} onChange={setExpirationDate} />
      </FieldWrap>

      <FieldWrap label="Notes (optional)">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything worth remembering" />
      </FieldWrap>

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" fullWidth disabled={!canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
