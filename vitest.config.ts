import { defineConfig } from 'vitest/config'

// Deliberately separate from vite.config.ts: every test here targets pure
// business logic (no components under test), so this needs neither the
// React plugin nor a DOM environment — just Vitest's default Node runtime
// against a handful of files under src/lib.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
