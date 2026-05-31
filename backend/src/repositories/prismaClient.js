const { PrismaClient } = require('@prisma/client')

// Singleton: reutilizar la misma instancia en toda la app
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
})

module.exports = prisma
