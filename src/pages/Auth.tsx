import { useState } from 'react'
import { motion } from 'framer-motion'
import { Refrigerator, CircleAlert, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/useAuthStore'
import { Button } from '../components/ui/Button'
import { FieldWrap, TextInput } from '../components/ui/Field'

type Mode = 'signIn' | 'signUp' | 'forgotPassword'

export const Auth = () => {
  const { t } = useTranslation('auth')
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset)
  const authError = useAuthStore((s) => s.authError)
  const clearAuthError = useAuthStore((s) => s.clearAuthError)

  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const switchMode = (next: Mode) => {
    setMode(next)
    setFormError(null)
    clearAuthError()
    setConfirmationSent(false)
    setResetEmailSent(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    clearAuthError()

    if (mode === 'forgotPassword') {
      setSubmitting(true)
      try {
        const result = await requestPasswordReset(email.trim())
        // Supabase itself never reveals whether the address has an account —
        // it succeeds either way — so showing the same confirmation here
        // regardless of the outcome doesn't leak anything beyond that.
        if (!result.error) setResetEmailSent(true)
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (mode === 'signUp' && password !== confirmPassword) {
      setFormError(t('errors.passwordsDontMatch'))
      return
    }
    if (password.length < 6) {
      setFormError(t('errors.passwordTooShort'))
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'signIn') {
        await signIn(email.trim(), password)
      } else {
        const result = await signUp(email.trim(), password)
        if (!result.error && result.needsEmailConfirmation) {
          setConfirmationSent(true)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const errorMessage = formError ?? authError

  const heading =
    mode === 'signIn' ? t('signIn.heading') : mode === 'signUp' ? t('signUp.heading') : t('forgotPassword.heading')
  const subtitle =
    mode === 'signIn' ? t('signIn.subtitle') : mode === 'signUp' ? t('signUp.subtitle') : t('forgotPassword.subtitle')

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
            <Refrigerator size={36} />
          </span>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-ink)]">{heading}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink-dim)]">{subtitle}</p>

          {confirmationSent ? (
            <div className="mt-8 flex w-full flex-col items-center gap-3 rounded-3xl bg-[var(--color-accent-soft)] p-6 text-center">
              <Mail size={28} className="text-[var(--color-accent)]" />
              <p className="text-[15px] font-semibold text-[var(--color-ink)]">{t('signupConfirmation.title')}</p>
              <p className="text-[13.5px] text-[var(--color-ink-dim)]">{t('signupConfirmation.body', { email })}</p>
              <Button variant="secondary" onClick={() => switchMode('signIn')}>
                {t('signupConfirmation.backToLogin')}
              </Button>
            </div>
          ) : resetEmailSent ? (
            <div className="mt-8 flex w-full flex-col items-center gap-3 rounded-3xl bg-[var(--color-accent-soft)] p-6 text-center">
              <Mail size={28} className="text-[var(--color-accent)]" />
              <p className="text-[15px] font-semibold text-[var(--color-ink)]">{t('forgotPassword.successTitle')}</p>
              <p className="text-[13.5px] text-[var(--color-ink-dim)]">{t('forgotPassword.successBody', { email })}</p>
              <Button variant="secondary" onClick={() => switchMode('signIn')}>
                {t('forgotPassword.backToLogin')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex w-full flex-col gap-4">
              <FieldWrap label={t('email')}>
                <TextInput
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus={mode === 'forgotPassword'}
                />
              </FieldWrap>

              {mode !== 'forgotPassword' && (
                <FieldWrap label={t('password')}>
                  <TextInput
                    type="password"
                    autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </FieldWrap>
              )}
              {mode === 'signUp' && (
                <FieldWrap label={t('confirmPassword')}>
                  <TextInput
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </FieldWrap>
              )}

              {mode === 'signIn' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgotPassword')}
                  className="-mt-2 self-end text-[13px] font-semibold text-[var(--color-accent)]"
                >
                  {t('forgotPassword.link')}
                </button>
              )}

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-bad-soft)] px-4 py-3 text-left text-[13.5px] font-medium text-[var(--color-bad)]">
                  <CircleAlert size={16} className="shrink-0" />
                  {errorMessage}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" className="mt-1" disabled={submitting}>
                {submitting
                  ? t('pleaseWait')
                  : mode === 'signIn'
                    ? t('logIn')
                    : mode === 'signUp'
                      ? t('signUpButton')
                      : t('forgotPassword.submit')}
              </Button>

              {mode === 'forgotPassword' && (
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="text-[14px] font-medium text-[var(--color-ink-dim)]"
                >
                  {t('forgotPassword.backToLogin')}
                </button>
              )}
            </form>
          )}

          {!confirmationSent && !resetEmailSent && mode !== 'forgotPassword' && (
            <button
              type="button"
              onClick={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
              className="mt-6 text-[14px] font-medium text-[var(--color-ink-dim)]"
            >
              {mode === 'signIn' ? (
                <>
                  {t('noAccount')} <span className="font-semibold text-[var(--color-accent)]">{t('signUpLink')}</span>
                </>
              ) : (
                <>
                  {t('haveAccount')} <span className="font-semibold text-[var(--color-accent)]">{t('logInLink')}</span>
                </>
              )}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
