// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.js'], // Solo src/tests
    exclude: ['node_modules', 'dist', 'tests'], // Excluye tests/
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});