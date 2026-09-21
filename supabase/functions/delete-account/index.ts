// Deletes the CALLING user's own Supabase Auth account.
//
// The schema already defines `user_id uuid ... references auth.users (id)
// on delete cascade` on every Kitchen table (storage_units, categories,
// inventory_items, shopping_list_items, stat_events, user_settings, and —
// if that optional migration has been applied — known_products; see
// supabase/migrations/0001_init.sql and 0003_barcode_products.sql). A
// single `auth.admin.deleteUser()` call therefore removes all of that
// user's Kitchen data atomically, as part of the same underlying delete —
// this function deliberately does NOT delete rows from any Kitchen table
// itself, to avoid duplicating (and risking drifting from) that schema.
//
// Security model: the user id this function acts on is derived ONLY from
// verifying the caller's own access token via `auth.getUser()`. The
// request body, query string, and any other client-supplied input are
// never consulted for an id — there is no code path by which a caller can
// name a different user to delete. See the two-client split below.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// These three are auto-provided to every deployed Edge Function by
// Supabase — nothing to set manually via `supabase secrets set`. The
// service-role key here exists only in this function's server-side
// runtime; it is never sent to, or reachable from, the browser.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })

const isUserNotFoundError = (error: { status?: number; message?: string }): boolean =>
  error.status === 404 || /not\s*found/i.test(error.message ?? '')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[delete-account] Missing required environment configuration')
    return jsonResponse(500, { error: 'Server misconfiguration' })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse(401, { error: 'Missing Authorization header' })
  }

  // Client #1 — scoped to the caller's own token, anon key only. Used
  // exclusively to verify who is calling. This client is never given
  // elevated privileges and is never used to perform the deletion itself.
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error: authError,
  } = await callerClient.auth.getUser()

  if (authError || !user) {
    return jsonResponse(401, { error: 'Invalid or expired session. Please log in again.' })
  }

  // The ONLY id ever used below. Derived exclusively from the verified
  // token above — never from req.json(), req.url search params, or any
  // other header.
  const callerUserId = user.id

  // Client #2 — service role, used ONLY for the admin delete call below,
  // and only with the id derived from client #1's verification.
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(callerUserId, false)

  if (deleteError) {
    // A "user not found" result means this account was already deleted —
    // most likely a retried request after a lost response to an earlier,
    // actually-successful call. Treat that as a successful, idempotent
    // outcome rather than an error.
    if (isUserNotFoundError(deleteError)) {
      return jsonResponse(200, { success: true, alreadyDeleted: true })
    }
    // Never relay internal error detail (stack traces, provider messages)
    // to the client — log server-side only, return a safe generic message.
    console.error('[delete-account] auth.admin.deleteUser failed:', deleteError.message)
    return jsonResponse(502, { error: 'Could not delete account. Please try again.' })
  }

  return jsonResponse(200, { success: true })
})
