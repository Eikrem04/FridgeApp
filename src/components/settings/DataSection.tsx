import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useToastStore } from '../../store/useToastStore'
import { SettingsSection, SettingsRow } from './SettingsSection'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export const DataSection = () => {
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetAllData = useStore((s) => s.resetAllData)
  const showToast = useToastStore((s) => s.show)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kitchen-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (file: File) => {
    const text = await file.text()
    const ok = await importData(text)
    if (ok) showToast('Data imported successfully')
  }

  return (
    <SettingsSection title="Data">
      <SettingsRow icon={<Download size={16} />} label="Export data" sub="Save a backup as JSON" onClick={handleExport} />
      <SettingsRow
        icon={<Upload size={16} />}
        label="Import data"
        sub="Restore from a backup file"
        onClick={() => fileInputRef.current?.click()}
      />
      <SettingsRow
        icon={<RotateCcw size={16} />}
        label="Reset all data"
        sub="Erase everything and start over"
        onClick={() => setConfirmReset(true)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImportFile(file)
          e.target.value = ''
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        message="This permanently deletes every item, storage unit and setting. This cannot be undone."
        confirmLabel="Reset everything"
        onConfirm={() => {
          setConfirmReset(false)
          void resetAllData()
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </SettingsSection>
  )
}
