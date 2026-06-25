/**
 * Tests — GET /estudiantes (búsqueda por nombre y/o curso)
 * Framework: Vitest (ESM)
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'

// Mock de Prisma — CORREGIDO
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    estudiante: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    involucrado: { findMany: vi.fn() },
  }
  return {
    PrismaClient: class {
      constructor() {
        return mockPrisma
      }
    },
  }
})

// Mock de JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({
      sub: 1,
      email: 'inspector@colegio.cl',
      rol: 'INSPECTOR',
      funcionarioId: 10,
    })),
  },
}))

import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// App de prueba con la lógica del endpoint inline
function buildApp() {
  const app = express()
  app.use(express.json())

  // Middleware de autenticación
  app.use((req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Unauthorized', message: 'Se requiere token.' })
    try {
      req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'secret')
      next()
    } catch {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token inválido.' })
    }
  })

  // GET /estudiantes
  app.get('/', async (req, res) => {
    const { nombre, curso } = req.query
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit
    const where = {}

    if (nombre && nombre.trim() !== '') {
      where.OR = [
        { nombres: { contains: nombre.trim(), mode: 'insensitive' } },
        { apellidos: { contains: nombre.trim(), mode: 'insensitive' } },
      ]
    }
    if (curso && curso.trim() !== '') {
      where.curso = { equals: curso.trim(), mode: 'insensitive' }
    }

    try {
      const [total, estudiantes] = await Promise.all([
        prisma.estudiante.count({ where }),
        prisma.estudiante.findMany({
          where,
          orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
          skip,
          take: limit,
          select: { id: true, rut: true, nombres: true, apellidos: true, curso: true },
        }),
      ])
      return res.status(200).json({
        data: estudiantes,
        paginacion: { total, page, limit, totalPaginas: Math.ceil(total / limit) },
      })
    } catch {
      return res.status(500).json({ error: 'Error interno del servidor.' })
    }
  })

  return app
}

// ── Datos de prueba ────────────────────────────────────────────────────────────
const estudiantesMock = [
  { id: 1, rut: '11111111-1', nombres: 'Gabriela', apellidos: 'Muñoz', curso: '3°A' },
  { id: 2, rut: '22222222-2', nombres: 'Gabriel', apellidos: 'Torres', curso: '3°A' },
  { id: 3, rut: '33333333-3', nombres: 'Diego', apellidos: 'Alday', curso: '4°B' },
]

const TOKEN = 'Bearer token-valido'
let app

beforeAll(() => {
  app = buildApp()
})
beforeEach(() => vi.clearAllMocks())

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('GET /estudiantes', () => {
  describe('🔒 Autenticación', () => {
    it('debe retornar 401 si no se envía token', async () => {
      const res = await request(app).get('/')
      expect(res.status).toBe(401)
    })
  })

  describe('📋 Sin parámetros', () => {
    it('debe retornar todos los estudiantes paginados con 200', async () => {
      prisma.estudiante.count.mockResolvedValue(3)
      prisma.estudiante.findMany.mockResolvedValue(estudiantesMock)

      const res = await request(app).get('/').set('Authorization', TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(3)
      expect(res.body.paginacion.total).toBe(3)
      expect(res.body.paginacion.page).toBe(1)
    })

    it('debe respetar los parámetros page y limit', async () => {
      prisma.estudiante.count.mockResolvedValue(3)
      prisma.estudiante.findMany.mockResolvedValue([estudiantesMock[0]])

      const res = await request(app).get('/?page=1&limit=1').set('Authorization', TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.paginacion.limit).toBe(1)
      expect(res.body.paginacion.totalPaginas).toBe(3)
    })
  })

  describe('🔍 Búsqueda por nombre parcial', () => {
    it('"Gab" debe encontrar a Gabriela y Gabriel', async () => {
      const resultado = estudiantesMock.filter(e => e.nombres.startsWith('Gab'))
      prisma.estudiante.count.mockResolvedValue(resultado.length)
      prisma.estudiante.findMany.mockResolvedValue(resultado)

      const res = await request(app).get('/?nombre=Gab').set('Authorization', TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.data.map(e => e.nombres)).toContain('Gabriela')
      expect(res.body.data.map(e => e.nombres)).toContain('Gabriel')

      const llamada = prisma.estudiante.findMany.mock.calls[0][0]
      expect(llamada.where.OR[0].nombres.contains).toBe('Gab')
    })

    it('debe retornar [] con 200 si no hay coincidencias', async () => {
      prisma.estudiante.count.mockResolvedValue(0)
      prisma.estudiante.findMany.mockResolvedValue([])

      const res = await request(app).get('/?nombre=XYZ_inexistente').set('Authorization', TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
      expect(res.body.paginacion.total).toBe(0)
    })
  })

  describe('🏫 Búsqueda por curso', () => {
    it('debe retornar solo los estudiantes del curso indicado', async () => {
      const resultado = estudiantesMock.filter(e => e.curso === '3°A')
      prisma.estudiante.count.mockResolvedValue(resultado.length)
      prisma.estudiante.findMany.mockResolvedValue(resultado)

      const res = await request(app).get('/?curso=3°A').set('Authorization', TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.data.every(e => e.curso === '3°A')).toBe(true)

      const llamada = prisma.estudiante.findMany.mock.calls[0][0]
      expect(llamada.where.curso).toBeDefined()
    })
  })

  describe('🔗 Combinación nombre + curso', () => {
    it('debe aplicar ambos filtros a la vez', async () => {
      prisma.estudiante.count.mockResolvedValue(1)
      prisma.estudiante.findMany.mockResolvedValue([estudiantesMock[0]])

      const res = await request(app)
        .get('/?nombre=Gabriela&curso=3°A')
        .set('Authorization', TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].nombres).toBe('Gabriela')

      const llamada = prisma.estudiante.findMany.mock.calls[0][0]
      expect(llamada.where.OR).toBeDefined()
      expect(llamada.where.curso).toBeDefined()
    })

    it('debe retornar [] si ningún estudiante cumple ambos filtros', async () => {
      prisma.estudiante.count.mockResolvedValue(0)
      prisma.estudiante.findMany.mockResolvedValue([])

      const res = await request(app).get('/?nombre=Diego&curso=3°A').set('Authorization', TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })
  })
})