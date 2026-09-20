# Kitchen — Fridge & Freezer Manager

A synced, multi-device app for tracking what's in your fridges and freezers: expiration dates, quantities, shopping lists, recipe suggestions, and food waste stats.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 for styling
- Zustand for client state, backed by Supabase (Postgres) as the source of truth
- Supabase Auth (email + password) with Row Level Security
- Supabase Realtime for cross-device sync
- React Router for navigation
- Framer Motion for animation
- date-fns for date handling

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). This creates all tables, Row Level Security policies, the new-user bootstrap trigger, and enables Realtime on every table.
3. Copy `.env.example` to `.env` and fill in your project's URL and anon key (Supabase dashboard → **Settings → API**):
   ```bash
   cp .env.example .env
   ```
4. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

See [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) for the full step-by-step guide, including Vercel deployment.

## Build

```bash
npm run build
```

## Data & sync

All app data (storage units, items, categories, shopping list, stats, settings) lives in Supabase, scoped per-user via Row Level Security — a user can only ever read or write their own rows. Changes made on one device appear on other signed-in devices in real time via Supabase Realtime.

Use Settings → Data to export a JSON backup or import one back in.
