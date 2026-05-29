import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app'
import { prismaMock, Prisma } from '../__mocks__/@prisma/client'

// NO se llama vi.mock() — el alias en vitest.config ya redirige @prisma/client al mock

const incidenteEj = { id: 1, fecha: new Date(), descripcion: 'test', tipo: 'AGRESION_FISICA', gravedad: 'GRAVE' }
const estudianteEj = { id: 10, nombres: 'Martín', apellidos: 'Alvarado', curso: '1°A' }

beforeEach(() => { vi.clearAllMocks() })

describe('POST /incidentes/:id/involucrados', () => {

  it('201 — crea involucrado con datos válidos', async () => {
    prismaMock.incidente.findUnique.mockResolvedValue(incidenteEj)
    prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)
    prismaMock.involucrado.create.mockResolvedValue({
      id: 1, incidenteId: 1, estudianteId: 10, rol: 'AFECTADO',
      observacion: null, estudiante: estudianteEj,
    })
    const res = await request(app).post('/incidentes/1/involucrados').send({ estudianteId: 10, rol: 'AFECTADO' })
    expect(res.status).toBe(201)
    expect(res.body.rol).toBe('AFECTADO')
    expect(res.body.estudiante.id).toBe(10)
  })

  it('400 — rol inválido', async () => {
    const res = await request(app).post('/incidentes/1/involucrados').send({ estudianteId: 10, rol: 'MALO' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/no es válido/)
    expect(prismaMock.incidente.findUnique).not.toHaveBeenCalled()
  })

  it('404 — incidente no existe', async () => {
    prismaMock.incidente.findUnique.mockResolvedValue(null)
    const res = await request(app).post('/incidentes/999/involucrados').send({ estudianteId: 10, rol: 'TESTIGO' })
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/incidente/)
  })

  it('404 — estudiante no existe', async () => {
    prismaMock.incidente.findUnique.mockResolvedValue(incidenteEj)
    prismaMock.estudiante.findUnique.mockResolvedValue(null)
    const res = await request(app).post('/incidentes/1/involucrados').send({ estudianteId: 999, rol: 'AFECTADO' })
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/estudiante/)
  })

  it('409 — mismo estudiante y rol duplicado', async () => {
    prismaMock.incidente.findUnique.mockResolvedValue(incidenteEj)
    prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)
    prismaMock.involucrado.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002' })
    )
    const res = await request(app).post('/incidentes/1/involucrados').send({ estudianteId: 10, rol: 'RESPONSABLE' })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/ya está registrado/)
  })

  it('400 — falta estudianteId', async () => {
    const res = await request(app).post('/incidentes/1/involucrados').send({ rol: 'TESTIGO' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/estudianteId/)
  })

  it('400 — falta rol', async () => {
    const res = await request(app).post('/incidentes/1/involucrados').send({ estudianteId: 10 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/rol/)
  })
})
