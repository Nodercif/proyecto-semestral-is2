/**
 * Tests — Tarea 4: Actualización del modelo de incidente
 * Stack: Vitest + Supertest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

process.env.JWT_SECRET     = 'test_secret_t4'
process.env.JWT_EXPIRES_IN = '1h'
process.env.NODE_ENV       = 'test'

// PrismaClient debe ser una clase (constructor), no una arrow function
vi.mock('@prisma/client', () => {
  const mockIncidente = {
    create:     vi.fn(),
    findUnique: vi.fn(),
    findMany:   vi.fn(),
  }
  class PrismaClient {
    constructor() {
      this.incidente = mockIncidente
    }
  }
  return { PrismaClient }
})

vi.mock('../config/prisma.js', () => ({
  default: {
    incidente: {
      create:     vi.fn(),
      findUnique: vi.fn(),
      findMany:   vi.fn(),
    },
    $connect:    vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

import app from '../index.js'
import { PrismaClient } from '@prisma/client'

// Esta instancia comparte el mismo mockIncidente del mock de arriba
const prismaRoutes = new PrismaClient()

const generarToken = (payload = {}) =>
  jwt.sign(
    {
      sub:           payload.sub           ?? 1,
      email:         payload.email         ?? 'inspector@colegio.cl',
      rol:           payload.rol           ?? 'INSPECTOR',
      funcionarioId: payload.funcionarioId ?? 10,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

const funcionarioMock = {
  id:        10,
  nombres:   'María',
  apellidos: 'Torres',
  cargo:     'INSPECTOR',
}

const incidenteCreado = {
  id:              42,
  tipo:            'ACOSO',
  gravedad:        'MODERADO',
  descripcion:     'Grupo de estudiantes acosa a un compañero.',
  fecha:           new Date('2024-05-10T10:30:00.000Z'),
  registradoPorId: 10,
  registradoPor:   funcionarioMock,
  involucrados:    [],
  createdAt:       new Date(),
  updatedAt:       new Date(),
}

const bodyValido = {
  fecha:       '2024-05-10T10:30:00.000Z',
  descripcion: 'Grupo de estudiantes acosa a un compañero.',
  tipo:        'ACOSO',
  gravedad:    'MODERADO',
}

beforeEach(() => vi.clearAllMocks())

// =============================================================================
// POST /incidentes — registradoPorId desde el token
// =============================================================================

describe('POST /incidentes — Tarea 4: registradoPorId desde el token', () => {

  it('debe usar req.usuario.funcionarioId como registradoPorId', async () => {
    prismaRoutes.incidente.create.mockResolvedValue(incidenteCreado)

    const token = generarToken({ funcionarioId: 10 })

    const res = await request(app)
      .post('/incidentes')
      .set('Authorization', `Bearer ${token}`)
      .send(bodyValido)

    expect(res.status).toBe(201)
    const llamadaData = prismaRoutes.incidente.create.mock.calls[0][0].data
    expect(llamadaData.registradoPorId).toBe(10)
  })

  it('no debe permitir sobreescribir registradoPorId desde el body', async () => {
    prismaRoutes.incidente.create.mockResolvedValue(incidenteCreado)

    const token = generarToken({ funcionarioId: 10 })

    await request(app)
      .post('/incidentes')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...bodyValido, registradoPorId: 99 })

    const llamadaData = prismaRoutes.incidente.create.mock.calls[0][0].data
    expect(llamadaData.registradoPorId).toBe(10)
    expect(llamadaData.registradoPorId).not.toBe(99)
  })

  it('sin token retorna 401', async () => {
    const res = await request(app)
      .post('/incidentes')
      .send(bodyValido)

    expect(res.status).toBe(401)
    expect(prismaRoutes.incidente.create).not.toHaveBeenCalled()
  })

  it('diferentes funcionarios quedan asociados según su propio token', async () => {
    prismaRoutes.incidente.create
      .mockResolvedValueOnce({ ...incidenteCreado, registradoPorId: 7 })
      .mockResolvedValueOnce({ ...incidenteCreado, registradoPorId: 22 })

    await request(app)
      .post('/incidentes')
      .set('Authorization', `Bearer ${generarToken({ funcionarioId: 7 })}`)
      .send(bodyValido)

    expect(prismaRoutes.incidente.create.mock.calls[0][0].data.registradoPorId).toBe(7)

    await request(app)
      .post('/incidentes')
      .set('Authorization', `Bearer ${generarToken({ funcionarioId: 22 })}`)
      .send(bodyValido)

    expect(prismaRoutes.incidente.create.mock.calls[1][0].data.registradoPorId).toBe(22)
  })
})

// =============================================================================
// Control de acceso por rol
// =============================================================================

describe('POST /incidentes — control de acceso por rol', () => {

  const ROLES_PERMITIDOS = [
    'ADMINISTRADOR',
    'ENCARGADO_CONVIVENCIA',
    'INSPECTOR',
    'DOCENTE',
    'ORIENTADOR',
    'EQUIPO_DIRECTIVO',
  ]

  ROLES_PERMITIDOS.forEach((rol) => {
    it(`rol ${rol} puede crear un incidente (201)`, async () => {
      prismaRoutes.incidente.create.mockResolvedValue(incidenteCreado)

      const res = await request(app)
        .post('/incidentes')
        .set('Authorization', `Bearer ${generarToken({ rol })}`)
        .send(bodyValido)

      expect(res.status).toBe(201)
    })
  })
})