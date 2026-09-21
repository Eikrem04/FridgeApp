import { useState } from 'react'
import { motion } from 'framer-motion'
import { Refrigerator, CircleAlert, Mail } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { Button } from '../components/ui/Button'
import { FieldWrap, TextInput } from '../components/ui/Field'

type Mode = 'signIn' | 'signUp' | 'forgotPassword'

export const Auth = () => {
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
      setFormError("Passwords don't match.")
      return
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.')
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
    mode === 'signIn' ? 'Welcome back' : mode === 'signUp' ? 'Create your account' : 'Reset your password'
  const subtitle =
    mode === 'signIn'
      ? 'Log in to sync your kitchen across every device.'
      : mode === 'signUp'
        ? 'Your fridge and freezer, kept in sync everywhere you go.'
        : "Enter your email and we'll send you a link to set a new password."

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
              <p className="text-[15px] font-semibold text-[var(--color-ink)]">Check your email</p>
              <p className="text-[13.5px] text-[var(--color-ink-dim)]">
                We sent a confirmation link to <span className="font-medium">{email}</span>. Confirm it, then log in below.
              </p>
              <Button variant="secondary" onClick={() => switchMode('signIn')}>
                Back to log in
              </Button>
            </div>
          ) : resetEmailSent ? (
            <div className="mt-8 flex w-full flex-col items-center gap-3 rounded-3xl bg-[var(--color-accent-soft)] p-6 text-center">
              <Mail size={28} className="text-[var(--color-accent)]" />
              <p className="text-[15px] font-semibold text-[var(--color-ink)]">Check your email</p>
              <p className="text-[13.5px] text-[var(--color-ink-dim)]">
                If an account exists for <span className="font-medium">{email}</span>, we've sent a link to reset your
                password. It'll bring you right back here.
              </p>
              <Button variant="secondary" onClick={() => switchMode('signIn')}>
                Back to log in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex w-full flex-col gap-4">
              <FieldWrap label="Email">
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
                <FieldWrap label="Password">
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
                <FieldWrap label="Confirm password">
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
                  Forgot password?
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
                  ? 'Please wait…'
                  : mode === 'signIn'
                    ? 'Log in'
                    : mode === 'signUp'
                      ? 'Sign up'
                      : 'Send reset link'}
              </Button>

              {mode === 'forgotPassword' && (
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="text-[14px] font-medium text-[var(--color-ink-dim)]"
                >
                  Back to log in
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
                  Don't have an account? <span className="font-semibold text-[var(--color-accent)]">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="font-semibold text-[var(--color-accent)]">Log in</span>
                </>
              )}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
