# Kitchen — Fridge & Freezer Manager

A local-first app for tracking what's in your fridges and freezers: expiration dates, quantities, shopping lists, recipe suggestions, and food waste stats.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 for styling
- Zustand (persisted to `localStorage`) for state
- React Router for navigation
- Framer Motion for animation
- date-fns for date handling

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

All data is stored locally in the browser (`localStorage`), so the app works fully offline after the first load. Use Settings → Data to export/import a JSON backup.
