import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    alias: {
      '@prisma/client': path.resolve(__dirname, 'src/__mocks__/@prisma/client.ts'),
    },
  },
})
