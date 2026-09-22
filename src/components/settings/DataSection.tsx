import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../store/useStore'
import { useToastStore } from '../../store/useToastStore'
import { SettingsSection, SettingsRow } from './SettingsSection'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export const DataSection = () => {
  const { t } = useTranslation('settings')
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
    if (ok) showToast(t('data.importedToast'))
  }

  return (
    <SettingsSection title={t('data.title')}>
      <SettingsRow icon={<Download size={16} />} label={t('data.export')} sub={t('data.exportSubtitle')} onClick={handleExport} />
      <SettingsRow
        icon={<Upload size={16} />}
        label={t('data.import')}
        sub={t('data.importSubtitle')}
        onClick={() => fileInputRef.current?.click()}
      />
      <SettingsRow
        icon={<RotateCcw size={16} />}
        label={t('data.reset')}
        sub={t('data.resetSubtitle')}
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
        title={t('data.resetConfirmTitle')}
        message={t('data.resetConfirmMessage')}
        confirmLabel={t('data.resetConfirmButton')}
        onConfirm={() => {
          setConfirmReset(false)
          void resetAllData()
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </SettingsSection>
  )
}
