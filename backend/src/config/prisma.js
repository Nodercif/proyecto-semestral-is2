// src/config/prisma.js
// Singleton del cliente Prisma para evitar múltiples conexiones en desarrollo

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['error'],
});

export default prisma;