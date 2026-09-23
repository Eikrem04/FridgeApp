import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChevronRight, PackageCheck, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { TopBar } from '../components/layout/TopBar'
import { ShoppingRow } from '../components/shopping/ShoppingRow'
import { PurchasedItemsSheet } from '../components/shopping/PurchasedItemsSheet'
import { EmptyState } from '../components/ui/EmptyState'
import { TextInput } from '../components/ui/Field'
import { Button } from '../components/ui/Button'

export const ShoppingList = () => {
  const { t } = useTranslation('shopping')
  const shoppingList = useStore((s) => s.shoppingList)
  const addShoppingItem = useStore((s) => s.addShoppingItem)
  const removeShoppingItem = useStore((s) => s.removeShoppingItem)
  const togglePurchased = useStore((s) => s.togglePurchased)
  const clearPurchased = useStore((s) => s.clearPurchased)

  const [newName, setNewName] = useState('')
  const [handleSheetOpen, setHandleSheetOpen] = useState(false)

  const pending = shoppingList.filter((s) => !s.purchased)
  const purchased = shoppingList.filter((s) => s.purchased)

  const submitAdd = () => {
    const name = newName.trim()
    if (!name) return
    addShoppingItem(name)
    setNewName('')
  }

  return (
    <div className="pb-28 md:pb-12">
      <TopBar title={t('title')} />
      <div className="px-5 md:px-8">
        <div className="mb-5 flex items-center gap-2">
          <TextInput
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
            placeholder={t('addPlaceholder')}
          />
          <Button size="md" icon={<Plus size={18} />} onClick={submitAdd} disabled={!newName.trim()} />
        </div>

        {shoppingList.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={26} />}
            title={t('emptyTitle')}
            subtitle={t('emptySubtitle')}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {purchased.length > 0 && (
              <button
                type="button"
                onClick={() => setHandleSheetOpen(true)}
                className="flex items-center justify-between rounded-2xl bg-[var(--color-accent-soft)] px-4 py-3.5 text-left transition active:opacity-80"
              >
                <span className="flex items-center gap-2.5 text-[15px] font-semibold text-[var(--color-accent)]">
                  <PackageCheck size={18} />
                  {t('handlePurchased.button', { count: purchased.length })}
                </span>
                <ChevronRight size={18} className="text-[var(--color-accent)]" />
              </button>
            )}

            <div>
              {pending.length > 0 && (
                <p className="mb-2 px-1 text-[13px] font-semibold text-[var(--color-ink-dim)]">{t('toBuy', { count: pending.length })}</p>
              )}
              <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {pending.map((item) => (
                    <ShoppingRow
                      key={item.id}
                      item={item}
                      onToggle={() => togglePurchased(item.id)}
                      onRemove={() => removeShoppingItem(item.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {purchased.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-[13px] font-semibold text-[var(--color-ink-dim)]">{t('purchased', { count: purchased.length })}</p>
                  <button
                    type="button"
                    onClick={clearPurchased}
                    className="flex items-center gap-1 text-[13px] font-semibold text-[var(--color-bad)]"
                  >
                    <Trash2 size={13} /> {t('clear')}
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {purchased.map((item) => (
                      <ShoppingRow
                        key={item.id}
                        item={item}
                        onToggle={() => togglePurchased(item.id)}
                        onRemove={() => removeShoppingItem(item.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PurchasedItemsSheet open={handleSheetOpen} onClose={() => setHandleSheetOpen(false)} />
    </div>
  )
}
