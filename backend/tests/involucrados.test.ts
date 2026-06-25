// tests/involucrados.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/index.js'

// ─── Mock de Prisma (debe apuntar a la ruta que usa el router) ──────────
vi.mock('../src/config/prisma.js', () => {
  const mockPrisma = {
    incidente: { findUnique: vi.fn() },
    estudiante: { findUnique: vi.fn() },
    involucrado: { create: vi.fn() },
  }
  return { default: mockPrisma }
})

// ─── Mock de JWT ─────────────────────────────────────────────────────────────
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({
      sub: 1,
      email: 'admin@colegio.cl',
      rol: 'ADMINISTRADOR',
      funcionarioId: 10,
    })),
  },
}))

import prisma from '../src/config/prisma.js'

const TOKEN = 'Bearer token-valido'

const incidenteEj = { id: 1, fecha: new Date(), descripcion: 'test', tipo: 'AGRESION_FISICA', gravedad: 'GRAVE' }
const estudianteEj = { id: 10, nombres: 'Martín', apellidos: 'Alvarado', curso: '1°A' }

beforeEach(() => { vi.clearAllMocks() })

describe('POST /incidentes/:id/involucrados', () => {

  it('201 — crea involucrado con datos válidos', async () => {
    prisma.incidente.findUnique.mockResolvedValue(incidenteEj)
    prisma.estudiante.findUnique.mockResolvedValue(estudianteEj)
    prisma.involucrado.create.mockResolvedValue({
      id: 1, incidenteId: 1, estudianteId: 10, rol: 'AFECTADO',
      observacion: null, estudiante: estudianteEj,
    })
    const res = await request(app)
      .post('/incidentes/1/involucrados')
      .set('Authorization', TOKEN)
      .send({ estudianteId: 10, rol: 'AFECTADO' })
    expect(res.status).toBe(201)
    expect(res.body.rol).toBe('AFECTADO')
    expect(res.body.estudiante.id).toBe(10)
  })

  it('400 — rol inválido', async () => {
    const res = await request(app)
      .post('/incidentes/1/involucrados')
      .set('Authorization', TOKEN)
      .send({ estudianteId: 10, rol: 'MALO' })
    expect(res.status).toBe(400)
    // El mensaje de error real contiene la lista de roles válidos
    expect(res.body.error).toMatch(/debe ser uno de/)
    expect(prisma.incidente.findUnique).not.toHaveBeenCalled()
  })

  it('404 — incidente no existe', async () => {
    prisma.incidente.findUnique.mockResolvedValue(null)
    const res = await request(app)
      .post('/incidentes/999/involucrados')
      .set('Authorization', TOKEN)
      .send({ estudianteId: 10, rol: 'TESTIGO' })
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/incidente/)
  })

  it('404 — estudiante no existe', async () => {
    prisma.incidente.findUnique.mockResolvedValue(incidenteEj)
    prisma.estudiante.findUnique.mockResolvedValue(null)
    const res = await request(app)
      .post('/incidentes/1/involucrados')
      .set('Authorization', TOKEN)
      .send({ estudianteId: 999, rol: 'AFECTADO' })
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/estudiante/)
  })

  it('409 — mismo estudiante y rol duplicado', async () => {
    prisma.incidente.findUnique.mockResolvedValue(incidenteEj)
    prisma.estudiante.findUnique.mockResolvedValue(estudianteEj)
    const error = new Error('Unique constraint failed')
    error.code = 'P2002'
    prisma.involucrado.create.mockRejectedValue(error)
    const res = await request(app)
      .post('/incidentes/1/involucrados')
      .set('Authorization', TOKEN)
      .send({ estudianteId: 10, rol: 'RESPONSABLE' })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/ya está registrado/)
  })

  it('400 — falta estudianteId', async () => {
    const res = await request(app)
      .post('/incidentes/1/involucrados')
      .set('Authorization', TOKEN)
      .send({ rol: 'TESTIGO' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/estudianteId/)
  })

  it('400 — falta rol', async () => {
    const res = await request(app)
      .post('/incidentes/1/involucrados')
      .set('Authorization', TOKEN)
      .send({ estudianteId: 10 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/rol/)
  })
})