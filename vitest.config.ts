import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Solo correr tests en src/tests/, ignorar backend/
    include: ['src/tests/**/*.test.ts'],
    singleThread: true,
    alias: {
      '@prisma/client': path.resolve(__dirname, 'src/__mocks__/@prisma/client.ts'),
    },
  },
})
