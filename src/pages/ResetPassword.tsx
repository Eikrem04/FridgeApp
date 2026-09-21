import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, CircleAlert, Check } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { Button } from '../components/ui/Button'
import { FieldWrap, TextInput } from '../components/ui/Field'

export const ResetPassword = () => {
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const signOut = useAuthStore((s) => s.signOut)
  const clearPasswordRecovery = useAuthStore((s) => s.clearPasswordRecovery)
  const authError = useAuthStore((s) => s.authError)
  const clearAuthError = useAuthStore((s) => s.clearAuthError)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    clearAuthError()

    if (password !== confirmPassword) {
      setFormError("Passwords don't match.")
      return
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      const result = await updatePassword(password)
      if (!result.error) setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  const errorMessage = formError ?? authError

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
            <KeyRound size={34} />
          </span>

          {done ? (
            <>
              <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-ink)]">Password updated</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
                Your password has been changed. You're signed in — continue into Kitchen below.
              </p>
              <div className="mt-8 flex w-full flex-col items-center gap-3 rounded-3xl bg-[var(--color-good-soft)] p-6 text-center">
                <Check size={28} className="text-[var(--color-good)]" />
                <Button fullWidth onClick={clearPasswordRecovery}>
                  Continue to Kitchen
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-ink)]">Set a new password</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
                Choose a new password for your Kitchen account.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 flex w-full flex-col gap-4">
                <FieldWrap label="New password">
                  <TextInput
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoFocus
                  />
                </FieldWrap>
                <FieldWrap label="Confirm new password">
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

                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-bad-soft)] px-4 py-3 text-left text-[13.5px] font-medium text-[var(--color-bad)]">
                    <CircleAlert size={16} className="shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" className="mt-1" disabled={submitting}>
                  {submitting ? 'Please wait…' : 'Update password'}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-6 text-[14px] font-medium text-[var(--color-ink-dim)]"
              >
                Cancel and sign out
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
