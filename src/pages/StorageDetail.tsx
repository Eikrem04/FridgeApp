import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { ItemRow } from '../components/inventory/ItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Sheet } from '../components/ui/Sheet'
import { TextInput } from '../components/ui/Field'
import { sortByExpirationAsc } from '../lib/selectors'
import { getExpirationStatus } from '../lib/expiration'
import { STORAGE_TYPE_META, getStorageDisplayName } from '../lib/storageTypes'

export const StorageDetail = () => {
  const { t } = useTranslation(['inventory', 'common'])
  const { id } = useParams()
  const navigate = useNavigate()
  const unit = useStore((s) => s.storageUnits.find((u) => u.id === id))
  const allItems = useStore((s) => s.items)
  const items = useMemo(() => allItems.filter((it) => it.storageId === id), [allItems, id])
  const expiringSoonDays = useStore((s) => s.settings.expiration.expiringSoonDays)
  const renameStorageUnit = useStore((s) => s.renameStorageUnit)
  const deleteStorageUnit = useStore((s) => s.deleteStorageUnit)

  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const sorted = useMemo(() => sortByExpirationAsc(items), [items])
  const expiringSoon = items.filter((it) => ['expiringSoon', 'expiresToday'].includes(getExpirationStatus(it, expiringSoonDays))).length
  const expired = items.filter((it) => getExpirationStatus(it, expiringSoonDays) === 'expired').length

  if (!unit) {
    return (
      <div className="px-5 pt-10">
        <EmptyState title={t('storageDetail.notFoundTitle')} subtitle={t('storageDetail.notFoundSubtitle')} />
      </div>
    )
  }

  const meta = STORAGE_TYPE_META[unit.type]
  const Icon = meta.icon
  const displayName = getStorageDisplayName(unit, t)

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
              setNewName(displayName)
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
            <h1 className="text-[24px] font-bold text-[var(--color-ink)]">{displayName}</h1>
            <p className="text-[14px] text-[var(--color-ink-dim)]">
              {t('storageDetail.itemsCount', { count: items.length })}
              {expiringSoon > 0 && (
                <span className="text-[var(--color-warn)]"> · {t('storageDetail.expiringSoon', { count: expiringSoon })}</span>
              )}
              {expired > 0 && <span className="text-[var(--color-bad)]"> · {t('storageDetail.expired', { count: expired })}</span>}
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
              title={t('storageDetail.emptyTitle', { name: displayName.toLowerCase() })}
              subtitle={t('storageDetail.emptySubtitle')}
              action={
                <Button icon={<Plus size={16} />} onClick={() => navigate(`/add?storage=${unit.id}`)}>
                  {t('storageDetail.addFirstItem')}
                </Button>
              }
            />
          )}
        </div>
      </div>

      <Sheet open={renaming} onClose={() => setRenaming(false)} title={t('storageDetail.renameTitle')}>
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
            {t('common:actions.save')}
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title={t('storageDetail.deleteTitle', { name: displayName })}
        message={t('storageDetail.deleteMessage', { count: items.length })}
        confirmLabel={t('common:actions.delete')}
        onConfirm={() => {
          deleteStorageUnit(unit.id)
          navigate('/')
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
