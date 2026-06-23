import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { prismaMock } from '../src/__mocks__/@prisma/client'

const estudianteEj = { id: 1, nombres: 'Martín', apellidos: 'Alvarado Torres', curso: '1°A' }
const involucradosEj = [
  {
    rol: 'RESPONSABLE', observacion: null,
    incidente: { id: 2, fecha: new Date('2026-04-22'), descripcion: 'Insultos', tipo: 'AGRESION_VERBAL', gravedad: 'MODERADO',
      registradoPor: { id: 1, nombres: 'Gabriela', apellidos: 'Muñoz', cargo: 'ENCARGADO_CONVIVENCIA' } },
  },
  {
    rol: 'RESPONSABLE', observacion: null,
    incidente: { id: 1, fecha: new Date('2026-04-10'), descripcion: 'Pelea', tipo: 'AGRESION_FISICA', gravedad: 'GRAVE',
      registradoPor: { id: 1, nombres: 'Gabriela', apellidos: 'Muñoz', cargo: 'ENCARGADO_CONVIVENCIA' } },
  },
]

beforeEach(() => { vi.clearAllMocks() })

describe('GET /estudiantes/:id/incidentes', () => {

  it('200 — retorna historial con rol en cada incidente', async () => {
    prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)
    prismaMock.involucrado.findMany.mockResolvedValue(involucradosEj)
    const res = await request(app).get('/estudiantes/1/incidentes')
    expect(res.status).toBe(200)
    expect(res.body.incidentes).toHaveLength(2)
    expect(res.body.incidentes[0].rol).toBeDefined()
  })

  it('200 con lista vacía si no tiene incidentes', async () => {
    prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)
    prismaMock.involucrado.findMany.mockResolvedValue([])
    const res = await request(app).get('/estudiantes/1/incidentes')
    expect(res.status).toBe(200)
    expect(res.body.incidentes).toEqual([])
    expect(res.body.totalIncidentes).toBe(0)
  })

  it('404 si el estudiante no existe', async () => {
    prismaMock.estudiante.findUnique.mockResolvedValue(null)
    const res = await request(app).get('/estudiantes/999/incidentes')
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/estudiante/)
  })

  it('Incidentes ordenados por fecha descendente', async () => {
    prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)
    prismaMock.involucrado.findMany.mockResolvedValue(involucradosEj)
    const res = await request(app).get('/estudiantes/1/incidentes')
    const fechas = res.body.incidentes.map((i: any) => new Date(i.incidente.fecha).getTime())
    for (let idx = 1; idx < fechas.length; idx++) {
      expect(fechas[idx]).toBeLessThanOrEqual(fechas[idx - 1])
    }
  })

  it('Cada incidente tiene fecha, tipo, gravedad y descripción', async () => {
    prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)
    prismaMock.involucrado.findMany.mockResolvedValue(involucradosEj)
    const res = await request(app).get('/estudiantes/1/incidentes')
    for (const item of res.body.incidentes) {
      expect(item.incidente.fecha).toBeDefined()
      expect(item.incidente.tipo).toBeDefined()
      expect(item.incidente.gravedad).toBeDefined()
      expect(item.incidente.descripcion).toBeDefined()
    }
  })

  it('400 si el id no es numérico', async () => {
    const res = await request(app).get('/estudiantes/abc/incidentes')
    expect(res.status).toBe(400)
  })
})
