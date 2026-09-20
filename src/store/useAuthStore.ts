import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: User | null
  authError: string | null
  init: () => () => void
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  clearAuthError: () => void
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
  return message
}

let hasInitialized = false

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  user: null,
  authError: null,

  init: () => {
    if (hasInitialized) return () => {}
    hasInitialized = true

    supabase.auth.getSession().then(({ data }) => {
      set({
        user: data.session?.user ?? null,
        status: data.session ? 'authenticated' : 'unauthenticated',
      })
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
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
}))
