import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../store/useStore'
import { useToastStore } from '../../store/useToastStore'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { SelectInput } from '../ui/Field'
import { getStorageDisplayName } from '../../lib/storageTypes'
import { getUnitLabel } from '../../lib/inventory'

interface PurchasedItemsSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Batch flow for items the user has checked off while shopping. Checking a
 * box never opens this itself (see ShoppingList.tsx) — it only opens when
 * the user explicitly taps "Handle purchased items", so multiple items can
 * be checked without interruption first.
 */
export const PurchasedItemsSheet = ({ open, onClose }: PurchasedItemsSheetProps) => {
  const { t } = useTranslation(['shopping', 'common'])
  const shoppingList = useStore((s) => s.shoppingList)
  const storageUnits = useStore((s) => s.storageUnits)
  const clearPurchased = useStore((s) => s.clearPurchased)
  const showToast = useToastStore((s) => s.show)
  const [destinations, setDestinations] = useState<Record<string, string>>({})
  const [bulkDestination, setBulkDestination] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const purchased = shoppingList.filter((item) => item.purchased)
  const destinationFor = (itemId: string) => destinations[itemId] ?? storageUnits[0]?.id ?? ''

  // A one-time bulk assignment, not a synced "controller" — individual rows stay
  // independently editable afterward, exactly as if each had been set by hand.
  const applyBulkDestination = (storageId: string) => {
    setBulkDestination(storageId)
    setDestinations((d) => {
      const next = { ...d }
      for (const item of purchased) next[item.id] = storageId
      return next
    })
  }

  // Sequential on purpose: restockShoppingItem's own error-rollback replaces the whole
  // shoppingList with a snapshot taken at call time — running these concurrently could let
  // one item's rollback resurrect another item that had already succeeded moments earlier.
  const handleAddToKitchen = async () => {
    if (purchased.length === 0 || storageUnits.length === 0) return
    setSubmitting(true)
    const targets = purchased.map((item) => ({ id: item.id, storageId: destinationFor(item.id) }))
    let succeeded = 0
    for (const target of targets) {
      try {
        await useStore.getState().restockShoppingItem(target.id, target.storageId)
        const stillPresent = useStore.getState().shoppingList.some((i) => i.id === target.id)
        if (!stillPresent) succeeded++
      } catch {
        // Swallow and continue — the item stays on the list (never silently lost), and any
        // Supabase-level failure already surfaced its own toast from inside the store action.
      }
    }
    setSubmitting(false)

    if (succeeded > 0) {
      showToast(
        succeeded === targets.length
          ? t('handlePurchased.addedAllToast', { count: succeeded })
          : t('handlePurchased.addedPartialToast', { added: succeeded, total: targets.length }),
      )
    }

    const remaining = useStore.getState().shoppingList.filter((i) => i.purchased).length
    if (remaining === 0) onClose()
  }

  const handleRemoveFromList = async () => {
    setSubmitting(true)
    const countBefore = purchased.length
    await clearPurchased()
    setSubmitting(false)

    const remaining = useStore.getState().shoppingList.filter((i) => i.purchased).length
    if (remaining === 0) {
      showToast(t('handlePurchased.removedToast', { count: countBefore }))
      onClose()
    }
    // If items remain, clearPurchased already surfaced its own error toast — leave the
    // sheet open so the user can see and retry rather than losing track of them.
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('handlePurchased.sheetTitle', { count: purchased.length })}>
      <div className="flex flex-col gap-4">
        <p className="text-[14.5px] text-[var(--color-ink-dim)]">{t('handlePurchased.body')}</p>

        {storageUnits.length > 0 && purchased.length > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-accent-soft)] px-4 py-3">
            <label htmlFor="purchased-set-all" className="text-[13.5px] font-semibold text-[var(--color-accent)]">
              {t('handlePurchased.setAllTo')}
            </label>
            <SelectInput
              id="purchased-set-all"
              className="w-auto shrink-0"
              value={bulkDestination || destinationFor(purchased[0].id)}
              onChange={(e) => applyBulkDestination(e.target.value)}
              disabled={submitting}
            >
              {storageUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {getStorageDisplayName(u, t)}
                </option>
              ))}
            </SelectInput>
          </div>
        )}

        <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
          {purchased.map((item) => (
            <div key={item.id} className="rounded-2xl bg-black/[0.03] px-4 py-3 dark:bg-white/[0.05]">
              <p className="truncate text-[14.5px] font-medium text-[var(--color-ink)]">{item.name}</p>
              {(item.quantity || item.unit) && (
                <p className="text-[12px] text-[var(--color-ink-faint)]">
                  {item.quantity ?? 1} {getUnitLabel(item.unit ?? 'pcs', t)}
                </p>
              )}
              {storageUnits.length > 0 && (
                <SelectInput
                  className="mt-2"
                  value={destinationFor(item.id)}
                  onChange={(e) => setDestinations((d) => ({ ...d, [item.id]: e.target.value }))}
                  disabled={submitting}
                >
                  {storageUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getStorageDisplayName(u, t)}
                    </option>
                  ))}
                </SelectInput>
              )}
            </div>
          ))}
        </div>

        {storageUnits.length === 0 && (
          <p className="text-[13px] text-[var(--color-warn)]">{t('handlePurchased.noStorageWarning')}</p>
        )}

        <div className="flex flex-col gap-2.5">
          <Button fullWidth onClick={handleAddToKitchen} disabled={submitting || storageUnits.length === 0}>
            {t('handlePurchased.addToKitchen')}
          </Button>
          <Button variant="secondary" fullWidth onClick={handleRemoveFromList} disabled={submitting}>
            {t('handlePurchased.removeFromList')}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
