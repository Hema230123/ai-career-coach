/**
 * vitest.config.ts
 *
 * WHAT IS THIS FILE?
 * This configures Vitest — the test runner we use to run automated tests.
 *
 * WHAT IS VITEST?
 * Vitest is a fast testing framework for JavaScript/TypeScript projects.
 * You write test files (e.g., `auth.test.ts`) and Vitest runs them,
 * telling you which tests pass and which fail.
 *
 * KEY SETTINGS EXPLAINED:
 *
 * - environment: 'jsdom'
 *   Tests run in a simulated browser environment (jsdom) instead of Node.js.
 *   This lets you test React components that use browser APIs like `document`.
 *
 * - globals: true
 *   Makes test functions like `describe`, `it`, `expect`, `test` available
 *   globally without needing to import them in every test file.
 *
 * - resolve.alias
 *   Maps the `@` shortcut to `./src` — the same alias defined in tsconfig.json.
 *   This means `import { foo } from '@/lib/utils'` works in test files too.
 *
 * NOTE ON PLUGINS:
 * We intentionally do NOT use @vitejs/plugin-react here because it ships
 * its own version of Vite that conflicts with the one bundled inside Vitest.
 * Vitest handles JSX/TSX transformation natively — no plugin needed.
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Run tests in a simulated browser environment
    environment: 'jsdom',

    // Make describe/it/expect available without imports in every test file
    globals: true,
  },
  resolve: {
    alias: {
      // Mirror the path alias from tsconfig.json so @/... imports work in tests
      '@': path.resolve(__dirname, './src'),
    },
  },
})
