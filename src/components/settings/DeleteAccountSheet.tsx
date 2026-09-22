import { useState } from 'react'
import { CircleAlert, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { FieldWrap, TextInput } from '../ui/Field'

export const DeleteAccountSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation(['settings', 'common'])
  const deleteAccount = useAuthStore((s) => s.deleteAccount)
  const signOut = useAuthStore((s) => s.signOut)

  const confirmPhrase = t('deleteAccount.confirmPlaceholder')
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = confirmText === confirmPhrase && !submitting

  const handleClose = () => {
    if (submitting) return
    setConfirmText('')
    setError(null)
    onClose()
  }

  const handleDelete = async () => {
    if (!canDelete) return
    setSubmitting(true)
    setError(null)

    const result = await deleteAccount()
    if (result.error) {
      setSubmitting(false)
      setError(result.error)
      return
    }

    // The account is confirmed deleted server-side at this point. Only now
    // do we clear the local session — existing App.tsx/useStore teardown
    // logic takes it from here (unauthenticated → teardown() → <Auth/>).
    try {
      await signOut()
    } catch {
      // The account is already gone; a local sign-out hiccup shouldn't
      // strand the user on this screen.
    }
  }

  return (
    <Sheet open={open} onClose={handleClose} title={t('deleteAccount.title')}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-bad-soft)] p-4">
          <Trash2 size={18} className="mt-0.5 shrink-0 text-[var(--color-bad)]" />
          <p className="text-[13.5px] leading-relaxed text-[var(--color-ink)]">{t('deleteAccount.warning')}</p>
        </div>

        <FieldWrap label={t('deleteAccount.confirmLabel')}>
          <TextInput
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmPhrase}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            disabled={submitting}
          />
        </FieldWrap>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-bad-soft)] px-4 py-3 text-left text-[13.5px] font-medium text-[var(--color-bad)]">
            <CircleAlert size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={handleClose} disabled={submitting}>
            {t('deleteAccount.cancel')}
          </Button>
          <Button variant="danger" fullWidth onClick={() => void handleDelete()} disabled={!canDelete}>
            {submitting ? t('deleteAccount.submitting') : t('deleteAccount.submit')}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
