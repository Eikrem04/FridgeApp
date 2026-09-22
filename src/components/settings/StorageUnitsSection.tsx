import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { StorageType, StorageUnit } from '../../types'
import { Sheet } from '../ui/Sheet'
import { TextInput, FieldWrap } from '../ui/Field'
import { Segmented } from '../ui/Segmented'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { SettingsSection, SettingsRow } from './SettingsSection'
import { STORAGE_TYPE_META, STORAGE_TYPE_OPTIONS } from '../../lib/storageTypes'

export const StorageUnitsSection = () => {
  const storageUnits = useStore((s) => s.storageUnits)
  const addStorageUnit = useStore((s) => s.addStorageUnit)
  const renameStorageUnit = useStore((s) => s.renameStorageUnit)
  const deleteStorageUnit = useStore((s) => s.deleteStorageUnit)
  const items = useStore((s) => s.items)

  const [editing, setEditing] = useState<StorageUnit | null>(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<StorageType>('fridge')
  const [deleteTarget, setDeleteTarget] = useState<StorageUnit | null>(null)

  const openAdd = () => {
    setName('')
    setType('fridge')
    setAdding(true)
  }

  const openEdit = (unit: StorageUnit) => {
    setEditing(unit)
    setName(unit.name)
  }

  return (
    <SettingsSection title="Storage units">
      {storageUnits.map((unit) => {
        const UnitIcon = STORAGE_TYPE_META[unit.type].icon
        return (
        <SettingsRow
          key={unit.id}
          icon={<UnitIcon size={17} />}
          label={unit.name}
          sub={`${items.filter((it) => it.storageId === unit.id).length} items`}
          right={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openEdit(unit)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-dim)] hover:bg-black/[0.04] dark:hover:bg-white/5"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(unit)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-bad)] hover:bg-[var(--color-bad-soft)]"
              >
                <Trash2 size={15} />
              </button>
            </div>
          }
        />
        )
      })}

      <button
        type="button"
        onClick={openAdd}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-semibold text-[var(--color-accent)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
          <Plus size={16} />
        </span>
        Add storage
      </button>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add storage">
        <div className="flex flex-col gap-4">
          <FieldWrap label="Type">
            <Segmented options={STORAGE_TYPE_OPTIONS} value={type} onChange={setType} />
          </FieldWrap>
          <FieldWrap label="Name">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'fridge' ? 'e.g. Main Fridge' : type === 'freezer' ? 'e.g. Chest Freezer' : 'e.g. Kitchen Pantry'}
              autoFocus
            />
          </FieldWrap>
          <Button
            fullWidth
            disabled={!name.trim()}
            onClick={() => {
              addStorageUnit(name.trim(), type)
              setAdding(false)
            }}
          >
            Add
          </Button>
        </div>
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Rename storage">
        <div className="flex flex-col gap-4">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Button
            fullWidth
            disabled={!name.trim()}
            onClick={() => {
              if (editing) renameStorageUnit(editing.id, name.trim())
              setEditing(null)
            }}
          >
            Save
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.name}?`}
        message={`This will remove it and all ${items.filter((it) => it.storageId === deleteTarget?.id).length} item(s) inside.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteStorageUnit(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </SettingsSection>
  )
}
