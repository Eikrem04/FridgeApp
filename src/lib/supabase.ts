import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * `createClient` resolves every sub-service URL (auth/v1, rest/v1, realtime/v1, …) by
 * combining VITE_SUPABASE_URL with a relative path (e.g. `new URL('auth/v1', supabaseUrl)`).
 * If the configured URL still has a path on it — a trailing slash, `/rest/v1`, `/auth/v1`,
 * anything copied from the wrong field in the Supabase dashboard — that path becomes part of
 * the base, and every request gets nested under it (e.g. `/rest/v1/auth/v1/signup`). Supabase's
 * gateway then rejects the request with "Invalid path specified in request URL", which looks
 * like an auth bug but is really a malformed base URL. Normalizing to the origin here removes
 * any path/query/hash so this class of misconfiguration can't happen regardless of exactly
 * what was pasted into the environment variable.
 */
const resolveSupabaseUrl = (value: string | undefined): string | null => {
  if (!value) return null
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

const supabaseUrl = resolveSupabaseUrl(rawUrl)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    'Missing or invalid Supabase environment variables. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY with the values from Supabase → Settings → API.',
  )
} else if (rawUrl && supabaseUrl && rawUrl.replace(/\/+$/, '') !== supabaseUrl) {
  // Don't log the value itself — just flag that it needed correcting, since a stray path
  // segment here is the single most common cause of "Invalid path specified in request URL".
  console.warn(
    'VITE_SUPABASE_URL should be just your project\'s base URL with no path (e.g. https://your-project-ref.supabase.co) — extra path segments or a trailing slash were detected and stripped.',
  )
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
