import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: User | null
  authError: string | null
  /**
   * True from the moment Supabase's `PASSWORD_RECOVERY` auth event fires
   * (the user opened their reset-password email link) until they finish
   * setting a new password. While true, `status` is already "authenticated"
   * (the recovery link grants a real session) — App.tsx checks this flag
   * first to show the reset-password screen instead of the normal app.
   */
  isPasswordRecovery: boolean
  init: () => () => void
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  clearAuthError: () => void
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  clearPasswordRecovery: () => void
  deleteAccount: () => Promise<{ error: string | null }>
}

const friendlyAuthError = (message: string): string => {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  if (message.toLowerCase().includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (message.toLowerCase().includes('password should be at least')) {
    return 'Password must be at least 6 characters.'
  }
  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Please confirm your email address before logging in.'
  }
  if (message.toLowerCase().includes('link is invalid or has expired')) {
    return 'That reset link is invalid or has expired. Request a new one.'
  }
  if (message.toLowerCase().includes('should be different from the old password')) {
    return 'Choose a password different from your current one.'
  }
  return message
}

let hasInitialized = false

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  user: null,
  authError: null,
  isPasswordRecovery: false,

  init: () => {
    if (hasInitialized) return () => {}
    hasInitialized = true

    supabase.auth.getSession().then(({ data }) => {
      set({
        user: data.session?.user ?? null,
        status: data.session ? 'authenticated' : 'unauthenticated',
      })
    })

    // Supabase parses a recovery link's URL fragment automatically
    // (`detectSessionInUrl: true` in lib/supabase.ts) and fires this
    // `PASSWORD_RECOVERY` event with a real session attached — that event,
    // not the URL path, is the authoritative signal that the user needs to
    // set a new password before using the app normally.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      set({
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
        ...(session ? {} : { isPasswordRecovery: false }),
        ...(event === 'PASSWORD_RECOVERY' ? { isPasswordRecovery: true } : {}),
      })
    })

    return () => subscription.subscription.unsubscribe()
  },

  signUp: async (email, password) => {
    set({ authError: null })
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      const message = friendlyAuthError(error.message)
      set({ authError: message })
      return { error: message, needsEmailConfirmation: false }
    }
    const needsEmailConfirmation = !data.session
    return { error: null, needsEmailConfirmation }
  },

  signIn: async (email, password) => {
    set({ authError: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const message = friendlyAuthError(error.message)
      set({ authError: message })
      return { error: message }
    }
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },

  clearAuthError: () => set({ authError: null }),

  // Supabase never reveals whether an email address has an account here —
  // it responds the same way (no error) either way, so relaying its result
  // as-is (rather than adding our own "if this email exists…" branching)
  // doesn't leak anything beyond what Supabase itself already avoids.
  requestPasswordReset: async (email) => {
    set({ authError: null })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      const message = friendlyAuthError(error.message)
      set({ authError: message })
      return { error: message }
    }
    return { error: null }
  },

  updatePassword: async (password) => {
    set({ authError: null })
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      const message = friendlyAuthError(error.message)
      set({ authError: message })
      return { error: message }
    }
    return { error: null }
  },

  clearPasswordRecovery: () => set({ isPasswordRecovery: false }),

  // Calls the `delete-account` Edge Function using the CURRENT session —
  // supabase-js automatically attaches this user's own access token as the
  // request's Authorization header, so there is no id to pass and no way
  // for this call to name a different account. The function derives the id
  // to delete solely from that token server-side (see
  // supabase/functions/delete-account/index.ts). Local sign-out is
  // deliberately NOT performed here — the caller (the confirmation UI)
  // only does that after this resolves without an error, so a failed or
  // interrupted request never leaves the user logged out with an intact
  // account still sitting on the server.
  deleteAccount: async () => {
    set({ authError: null })
    const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('delete-account')

    if (error) {
      let message = 'Could not delete your account. Please try again.'
      const context = (error as { context?: Response }).context
      if (context) {
        try {
          const body = (await context.json()) as { error?: string }
          if (body?.error) message = body.error
        } catch {
          // Response body wasn't JSON (e.g. a network-level failure) — keep the generic message.
        }
      }
      set({ authError: message })
      return { error: message }
    }

    if (data?.success === false) {
      const message = data.error ?? 'Could not delete your account. Please try again.'
      set({ authError: message })
      return { error: message }
    }

    return { error: null }
  },
}))
