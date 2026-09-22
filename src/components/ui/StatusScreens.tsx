import { AlertTriangle, RefreshCw, Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

export const LoadingScreen = ({ message = 'Loading…' }: { message?: string }) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)]">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
    <p className="text-[15px] font-medium text-[var(--color-ink-dim)]">{message}</p>
  </div>
)

export const ErrorScreen = ({ message, onRetry }: { message: string | null; onRetry: () => void }) => {
  const { t } = useTranslation('common')
  // `message` may carry a raw Supabase/Postgrest error string (useful for
  // debugging, already logged to the console in useStore.ts) — the visible
  // UI always shows a translated, user-safe message instead of that raw
  // text, per the "don't expose raw system errors" rule.
  void message
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bad-soft)] text-[var(--color-bad)]">
        <AlertTriangle size={28} />
      </span>
      <p className="text-[17px] font-semibold text-[var(--color-ink)]">{t('errors.couldntLoad')}</p>
      <p className="max-w-xs text-[14.5px] text-[var(--color-ink-dim)]">{t('errors.network')}</p>
      <Button icon={<RefreshCw size={16} />} onClick={onRetry}>
        {t('actions.tryAgain')}
      </Button>
    </div>
  )
}

export const ConfigMissingScreen = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-8 text-center">
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-warn-soft)] text-[var(--color-warn)]">
      <Settings2 size={28} />
    </span>
    <p className="text-[17px] font-semibold text-[var(--color-ink)]">Supabase isn't configured yet</p>
    <p className="max-w-sm text-[14.5px] text-[var(--color-ink-dim)]">
      Copy <code className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[13px] dark:bg-white/10">.env.example</code> to{' '}
      <code className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[13px] dark:bg-white/10">.env</code> and fill in your
      Supabase project URL and anon key, then restart the dev server.
    </p>
  </div>
)
