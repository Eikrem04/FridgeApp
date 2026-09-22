import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { useToastStore } from '../store/useToastStore'
import { TopBar } from '../components/layout/TopBar'
import { ShoppingRow } from '../components/shopping/ShoppingRow'
import { EmptyState } from '../components/ui/EmptyState'
import { TextInput, SelectInput, FieldWrap } from '../components/ui/Field'
import { Sheet } from '../components/ui/Sheet'
import { Button } from '../components/ui/Button'
import { getStorageDisplayName } from '../lib/storageTypes'

export const ShoppingList = () => {
  const { t } = useTranslation('shopping')
  const shoppingList = useStore((s) => s.shoppingList)
  const storageUnits = useStore((s) => s.storageUnits)
  const addShoppingItem = useStore((s) => s.addShoppingItem)
  const removeShoppingItem = useStore((s) => s.removeShoppingItem)
  const togglePurchased = useStore((s) => s.togglePurchased)
  const clearPurchased = useStore((s) => s.clearPurchased)
  const restockShoppingItem = useStore((s) => s.restockShoppingItem)
  const showToast = useToastStore((s) => s.show)

  const [newName, setNewName] = useState('')
  const [restockTarget, setRestockTarget] = useState<string | null>(null)
  const [restockStorage, setRestockStorage] = useState(storageUnits[0]?.id ?? '')

  const pending = shoppingList.filter((s) => !s.purchased)
  const purchased = shoppingList.filter((s) => s.purchased)

  const submitAdd = () => {
    const name = newName.trim()
    if (!name) return
    addShoppingItem(name)
    setNewName('')
  }

  const handleTogglePurchased = (id: string, wasPurchased: boolean) => {
    togglePurchased(id)
    if (!wasPurchased && storageUnits.length > 0) {
      setRestockStorage(storageUnits[0].id)
      setRestockTarget(id)
    }
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
                      onToggle={() => handleTogglePurchased(item.id, item.purchased)}
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

      <Sheet open={!!restockTarget} onClose={() => setRestockTarget(null)} title={t('restock.title')}>
        <div className="flex flex-col gap-4">
          <p className="text-[14.5px] text-[var(--color-ink-dim)]">{t('restock.body')}</p>
          {storageUnits.length > 0 ? (
            <>
              <FieldWrap label={t('restock.storage')}>
                <SelectInput value={restockStorage} onChange={(e) => setRestockStorage(e.target.value)}>
                  {storageUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getStorageDisplayName(u, t)}
                    </option>
                  ))}
                </SelectInput>
              </FieldWrap>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setRestockTarget(null)}>
                  {t('restock.notNow')}
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    if (restockTarget) {
                      restockShoppingItem(restockTarget, restockStorage)
                      showToast(t('restock.addedToast'))
                    }
                    setRestockTarget(null)
                  }}
                >
                  {t('restock.addIt')}
                </Button>
              </div>
            </>
          ) : (
            <Button fullWidth onClick={() => setRestockTarget(null)}>
              {t('restock.done')}
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  )
}
