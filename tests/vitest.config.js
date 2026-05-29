// vitest.config.js
// Configuración de Vitest para tests de integración del backend
// Coloca este archivo en la raíz del proyecto.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Entorno Node.js puro (sin jsdom) para tests de API
    environment: 'node',

    // Archivo de variables de entorno para tests
    // Crea un archivo .env.test en la raíz con tus vars de test
    envFile: '.env.test',

    // Ejecutar los tests secuencialmente para evitar condiciones de carrera
    // en los mocks de Prisma (cada test configura su propio mockResolvedValueOnce)
    sequence: {
      concurrent: false,
    },

    // Timeout por test (ms) — bcrypt puede ser lento en CI
    testTimeout: 15000,

    // Patrón de archivos de test
    include: ['tests/**/*.test.{js,ts}', '**/*.integration.test.{js,ts}'],

    // Cobertura (opcional, activar con --coverage)
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/utils/seed.ts'],
      reporter: ['text', 'html'],
    },
  },
});
