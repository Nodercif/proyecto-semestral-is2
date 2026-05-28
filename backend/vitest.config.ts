import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    alias: {
      '@prisma/client': path.resolve(__dirname, 'src/__mocks__/@prisma/client.ts'),
    },
  },
})
