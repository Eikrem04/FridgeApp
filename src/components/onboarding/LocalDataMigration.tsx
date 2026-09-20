import { useState } from 'react'
import { motion } from 'framer-motion'
import { CloudUpload, HardDrive } from 'lucide-react'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { LegacyBackup } from '../../lib/migrateLocalData'
import { clearLegacyLocalData, importBackupToCloud } from '../../lib/migrateLocalData'
import { useStore } from '../../store/useStore'
import { useToastStore } from '../../store/useToastStore'

interface LocalDataMigrationProps {
  userId: string
  backup: LegacyBackup
  onDone: () => void
}

export const LocalDataMigration = ({ userId, backup, onDone }: LocalDataMigrationProps) => {
  const categories = useStore((s) => s.categories)
  const initializeForUser = useStore((s) => s.initializeForUser)
  const showToast = useToastStore((s) => s.show)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const itemCount = backup.items.length
  const storageCount = backup.storageUnits.length
  const shoppingCount = backup.shoppingList.length

  const handleImport = async () => {
    setImporting(true)
    setError(null)
    try {
      await importBackupToCloud(userId, backup, categories)
      clearLegacyLocalData()
      await initializeForUser(userId)
      showToast('Your data is now synced to your account')
      onDone()
    } catch {
      setError("Couldn't import your data — check your connection and try again.")
      setImporting(false)
    }
  }

  const handleDiscard = () => {
    clearLegacyLocalData()
    setConfirmDiscard(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-bg)]">
      <div className="safe-top safe-bottom mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center"
        >
          <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--color-accent)] text-white shadow-xl shadow-[var(--color-accent)]/20">
            <HardDrive size={36} />
          </span>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--color-ink)]">We found data on this device</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
            Before you signed in, this browser had a local kitchen with {storageCount} storage unit
            {storageCount === 1 ? '' : 's'}, {itemCount} item{itemCount === 1 ? '' : 's'}
            {shoppingCount > 0 ? `, and ${shoppingCount} shopping list item${shoppingCount === 1 ? '' : 's'}` : ''}. Import it
            into your account?
          </p>

          {error && (
            <div className="mt-4 w-full rounded-2xl bg-[var(--color-bad-soft)] px-4 py-3 text-[13.5px] font-medium text-[var(--color-bad)]">
              {error}
            </div>
          )}

          <div className="mt-8 flex w-full flex-col gap-3">
            <Button fullWidth size="lg" icon={<CloudUpload size={18} />} disabled={importing} onClick={handleImport}>
              {importing ? 'Importing…' : 'Import my data'}
            </Button>
            <Button variant="secondary" fullWidth disabled={importing} onClick={() => setConfirmDiscard(true)}>
              Start fresh instead
            </Button>
          </div>
        </motion.div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this device's data?"
        message="This local data was never uploaded anywhere. If you start fresh, it will be permanently deleted from this device."
        confirmLabel="Discard"
        onConfirm={handleDiscard}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  )
}
