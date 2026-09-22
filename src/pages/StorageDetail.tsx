import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ItemRow } from '../components/inventory/ItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Sheet } from '../components/ui/Sheet'
import { TextInput } from '../components/ui/Field'
import { sortByExpirationAsc } from '../lib/selectors'
import { getExpirationStatus } from '../lib/expiration'
import { STORAGE_TYPE_META } from '../lib/storageTypes'

export const StorageDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const unit = useStore((s) => s.storageUnits.find((u) => u.id === id))
  const allItems = useStore((s) => s.items)
  const items = useMemo(() => allItems.filter((it) => it.storageId === id), [allItems, id])
  const expiringSoonDays = useStore((s) => s.settings.expiration.expiringSoonDays)
  const renameStorageUnit = useStore((s) => s.renameStorageUnit)
  const deleteStorageUnit = useStore((s) => s.deleteStorageUnit)

  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(unit?.name ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const sorted = useMemo(() => sortByExpirationAsc(items), [items])
  const expiringSoon = items.filter((it) => ['expiringSoon', 'expiresToday'].includes(getExpirationStatus(it, expiringSoonDays))).length
  const expired = items.filter((it) => getExpirationStatus(it, expiringSoonDays) === 'expired').length

  if (!unit) {
    return (
      <div className="px-5 pt-10">
        <EmptyState title="Storage not found" subtitle="It may have been deleted." />
      </div>
    )
  }

  const meta = STORAGE_TYPE_META[unit.type]
  const Icon = meta.icon

  return (
    <div className="pb-28 md:pb-12">
      <header className="safe-top sticky top-0 z-30 flex items-center justify-between bg-[var(--color-bg)]/85 px-5 pb-3 pt-4 backdrop-blur-xl md:px-8 md:pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNewName(unit.name)
              setRenaming(true)
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10"
          >
            <Pencil size={17} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bad-soft)] text-[var(--color-bad)]"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      <div className="px-5 md:px-8">
        <div className="flex items-center gap-3.5">
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.bg} ${meta.text}`}>
            <Icon size={26} />
          </span>
          <div>
            <h1 className="text-[24px] font-bold text-[var(--color-ink)]">{unit.name}</h1>
            <p className="text-[14px] text-[var(--color-ink-dim)]">
              {items.length} items
              {expiringSoon > 0 && <span className="text-[var(--color-warn)]"> · {expiringSoon} expiring soon</span>}
              {expired > 0 && <span className="text-[var(--color-bad)]"> · {expired} expired</span>}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {sorted.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </AnimatePresence>
          {sorted.length === 0 && (
            <EmptyState
              icon={<Icon size={26} />}
              title={`Your ${unit.name.toLowerCase()} is looking pretty empty`}
              subtitle="Add your first item to start tracking what's inside."
              action={
                <Button icon={<Plus size={16} />} onClick={() => navigate(`/add?storage=${unit.id}`)}>
                  Add your first item
                </Button>
              }
            />
          )}
        </div>
      </div>

      <Sheet open={renaming} onClose={() => setRenaming(false)} title="Rename storage">
        <div className="flex flex-col gap-4">
          <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          <Button
            fullWidth
            disabled={!newName.trim()}
            onClick={() => {
              renameStorageUnit(unit.id, newName.trim())
              setRenaming(false)
            }}
          >
            Save
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${unit.name}?`}
        message={`This will permanently remove ${unit.name} and all ${items.length} item${items.length === 1 ? '' : 's'} inside it.`}
        confirmLabel="Delete"
        onConfirm={() => {
          deleteStorageUnit(unit.id)
          navigate('/')
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
