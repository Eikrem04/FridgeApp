import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '../ui/Sheet'
import { useStore } from '../../store/useStore'
import { useUiStore } from '../../store/useUiStore'
import { useToastStore } from '../../store/useToastStore'
import { Stepper } from '../ui/Stepper'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ZeroQuantityDialog } from './ZeroQuantityDialog'
import { ItemForm, type ItemFormValues } from './ItemForm'
import { CategoryIcon } from '../../lib/icons'
import { getCategoryDisplayName } from '../../lib/categoryLocalization'
import { getStorageDisplayName } from '../../lib/storageTypes'
import { formatAddedDate, formatFriendlyDate } from '../../lib/date'
import { getExpirationStatus, statusColors } from '../../lib/expiration'
import { StatusBadge } from '../ui/Badge'
import { Pencil, Star, Trash2 } from 'lucide-react'

export const ItemDetailSheet = () => {
  const { t } = useTranslation(['addItem', 'common'])
  const selectedItemId = useUiStore((s) => s.selectedItemId)
  const closeItem = useUiStore((s) => s.closeItem)
  const item = useStore((s) => s.items.find((it) => it.id === selectedItemId))
  const category = useStore((s) => s.categories.find((c) => c.id === item?.categoryId))
  const storage = useStore((s) => s.storageUnits.find((u) => u.id === item?.storageId))
  const expiringSoonDays = useStore((s) => s.settings.expiration.expiringSoonDays)
  const updateItem = useStore((s) => s.updateItem)
  const changeQuantity = useStore((s) => s.changeQuantity)
  const deleteItem = useStore((s) => s.deleteItem)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const addShoppingItem = useStore((s) => s.addShoppingItem)
  const addItem = useStore((s) => s.addItem)
  const showToast = useToastStore((s) => s.show)

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [zeroPrompt, setZeroPrompt] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  if (!item) return null

  const status = getExpirationStatus(item, expiringSoonDays)
  const colors = statusColors[status]

  const handleClose = () => {
    setEditing(false)
    closeItem()
  }

  const handleDelete = () => {
    const snapshot = { ...item }
    deleteItem(item.id, status === 'expired' ? 'expired' : 'discarded')
    setConfirmDelete(false)
    handleClose()
    showToast(t('detail.removedToast', { name: snapshot.name }), {
      label: t('detail.undo'),
      onClick: () =>
        addItem({
          name: snapshot.name,
          categoryId: snapshot.categoryId,
          quantity: snapshot.quantity,
          unit: snapshot.unit,
          storageId: snapshot.storageId,
          expirationDate: snapshot.expirationDate,
          notes: snapshot.notes,
        }),
    })
  }

  const handleQuantityChange = async (delta: number) => {
    const updated = await changeQuantity(item.id, delta)
    if (updated && updated.quantity === 0) {
      setZeroPrompt(true)
    }
  }

  const handleZeroAddToShoppingList = () => {
    addShoppingItem(item.name, { unit: item.unit, categoryId: item.categoryId })
    deleteItem(item.id, 'consumed')
    setZeroPrompt(false)
    handleClose()
    showToast(t('detail.movedToShoppingToast', { name: item.name }))
  }

  const handleZeroRemoveFromInventory = () => {
    const snapshot = { ...item }
    deleteItem(item.id, 'consumed')
    setZeroPrompt(false)
    handleClose()
    showToast(t('detail.removedToast', { name: snapshot.name }), {
      label: t('detail.undo'),
      onClick: () =>
        addItem({
          name: snapshot.name,
          categoryId: snapshot.categoryId,
          quantity: snapshot.quantity,
          unit: snapshot.unit,
          storageId: snapshot.storageId,
          expirationDate: snapshot.expirationDate,
          notes: snapshot.notes,
        }),
    })
  }

  const handleSubmitEdit = (values: ItemFormValues) => {
    updateItem(item.id, values)
    setEditing(false)
  }

  return (
    <>
      <Sheet open={!!selectedItemId} onClose={handleClose} title={editing ? t('detail.edit') : undefined}>
        {editing ? (
          <ItemForm
            initial={item}
            submitLabel={t('form.saveChanges')}
            onSubmit={handleSubmitEdit}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                {item.imageUrl && !imageFailed ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.bg} ${colors.text}`}>
                    <CategoryIcon name={category?.icon || 'Package'} size={26} />
                  </span>
                )}
                <div>
                  <h3 className="text-[19px] font-bold text-[var(--color-ink)]">{item.name}</h3>
                  <p className="text-[13.5px] text-[var(--color-ink-dim)]">
                    {category ? getCategoryDisplayName(category, t) : ''} · {storage ? getStorageDisplayName(storage, t) : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite(item.id)}
                aria-label={t('detail.toggleFavorite')}
                className="rounded-full p-2 transition active:scale-90"
              >
                <Star
                  size={22}
                  className={item.isFavorite ? 'fill-[var(--color-warn)] text-[var(--color-warn)]' : 'text-[var(--color-ink-faint)]'}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-black/[0.03] px-4 py-3.5 dark:bg-white/[0.05]">
              <span className="text-[14.5px] font-medium text-[var(--color-ink-dim)]">{t('detail.quantity')}</span>
              <Stepper value={item.quantity} onChange={(v) => handleQuantityChange(v - item.quantity)} />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-black/[0.03] px-4 py-3.5 dark:bg-white/[0.05]">
              <span className="text-[14.5px] font-medium text-[var(--color-ink-dim)]">{t('detail.expiration')}</span>
              <div className="flex items-center gap-2">
                {item.expirationDate && (
                  <span className="text-[14px] text-[var(--color-ink)]">{formatFriendlyDate(item.expirationDate)}</span>
                )}
                <StatusBadge status={status} label={t(`common:expiration.${status}`)} />
              </div>
            </div>

            {item.notes && (
              <div className="rounded-2xl bg-black/[0.03] px-4 py-3.5 dark:bg-white/[0.05]">
                <p className="mb-1 text-[13px] font-medium text-[var(--color-ink-dim)]">{t('detail.notes')}</p>
                <p className="text-[14.5px] text-[var(--color-ink)]">{item.notes}</p>
              </div>
            )}

            <p className="px-1 text-xs text-[var(--color-ink-faint)]">{t('detail.added', { date: formatAddedDate(item.dateAdded) })}</p>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth icon={<Pencil size={16} />} onClick={() => setEditing(true)}>
                {t('detail.edit')}
              </Button>
              <Button variant="danger" fullWidth icon={<Trash2 size={16} />} onClick={() => setConfirmDelete(true)}>
                {t('detail.delete')}
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title={t('detail.deleteTitle')}
        message={t('detail.deleteMessage', { name: item.name })}
        confirmLabel={t('detail.delete')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <ZeroQuantityDialog
        open={zeroPrompt}
        itemName={item.name}
        onKeepAtZero={() => setZeroPrompt(false)}
        onAddToShoppingList={handleZeroAddToShoppingList}
        onRemove={handleZeroRemoveFromInventory}
      />
    </>
  )
}
