# Supabase setup — manual steps

These steps happen in your Supabase and Vercel dashboards. I can't do them for you (I don't have access to your accounts), but everything else in the codebase is already wired up to work once you complete them.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick an organization, name (e.g. `kitchen`), a database password (save it somewhere safe — you likely won't need it again unless you connect directly to Postgres), and a region close to you.
3. Wait for the project to finish provisioning (~2 minutes).

## 2. Run the database migration

1. In your new project, open **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) from this repo, copy its entire contents, and paste it into the SQL editor.
4. Click **Run**.

This creates:
- `storage_units`, `categories`, `inventory_items`, `shopping_list_items`, `stat_events`, `user_settings` tables
- Row Level Security policies on every table so each user only ever sees their own rows
- A trigger that automatically gives every new user a default settings row and the standard set of categories (Dairy, Meat, Fish, etc.) the moment they sign up
- Realtime enabled on every table, so changes sync live across devices

If you ever change the schema, add new migration files (`0002_...sql`, etc.) rather than editing `0001_init.sql`.

## 3. Get your API credentials

1. In the Supabase dashboard: **Settings → API**.
2. Copy the **Project URL** and the **anon / public** key (not the `service_role` key — that one must never be used in this app or committed anywhere).

## 4. Configure local development

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

`.env` is already in `.gitignore` — it will not be committed. Restart `npm run dev` after editing it (Vite only reads env vars at startup).

## 5. Email confirmation (your choice)

By default, Supabase requires users to confirm their email before they can log in. For quick local testing you may want to turn this off:

- **Authentication → Providers → Email → "Confirm email"** toggle.

Turning it off means `signUp` immediately returns a session and the user is logged in right away. Leaving it on is more secure for a real deployment — the app already handles both cases (it shows a "check your email" screen when confirmation is required).

## 6. Deploy to Vercel

Your app is already connected to GitHub/Vercel. Add the same two environment variables there:

1. Vercel dashboard → your project → **Settings → Environment Variables**.
2. Add:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
3. Apply to **Production**, **Preview**, and **Development** environments (or at least Production).
4. Redeploy (Vercel → Deployments → ⋯ → Redeploy), or just push a new commit.

No other Vercel configuration is needed — it's a static Vite build, same as before.

## 7. Try it out

Once steps 1–4 are done locally:

1. Run `npm run dev`, open the app — you should see a "Welcome back" / sign-up screen instead of the old onboarding flow.
2. Sign up with an email + password.
3. If you had existing data in this browser from before (the old local-only version), the app will detect it and offer to import it into your new account.
4. Add an item, then open the same account in another browser (or your phone) — it should appear there too within a second or two, thanks to Supabase Realtime.

## Notes on security

- The anon key is safe to expose in the client bundle — it's how every Supabase web app works. Access control comes entirely from Row Level Security (`auth.uid() = user_id` on every table), not from hiding this key.
- Never put the `service_role` key in this app, in `.env`, or in Vercel env vars for the frontend — it bypasses RLS entirely.
