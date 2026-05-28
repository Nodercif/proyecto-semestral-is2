/**
 * Tests — Tarea 4: POST /incidentes/:id/involucrados
 * Valida los criterios de aceptación definidos en el Sprint Backlog.
 *
 * Autor: Ignacio Jara Valdebenito
 *
 * Ejecutar: npm test
 * (usa vitest en modo in-source con una base de datos de prueba real)
 *
 * IMPORTANTE: requiere la variable de entorno DATABASE_URL apuntando
 * a una BD PostgreSQL de prueba y el seed ejecutado previamente.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// IDs que se populan en el seed de Gabriela (tarea 1)
// Si los IDs difieren en tu entorno, cámbialos aquí.
let incidenteId: number
let estudianteId: number
let estudiante2Id: number

beforeAll(async () => {
  // Obtener el primer incidente y dos estudiantes del seed
  const incidente = await prisma.incidente.findFirst({ orderBy: { id: 'asc' } })
  const estudiantes = await prisma.estudiante.findMany({ orderBy: { id: 'asc' }, take: 2 })

  if (!incidente || estudiantes.length < 2) {
    throw new Error('Ejecuta el seed antes de correr los tests: npm run db:seed')
  }

  incidenteId = incidente.id
  estudianteId = estudiantes[0].id
  estudiante2Id = estudiantes[1].id

  // Limpiar involucrados previos del incidente de prueba para partir limpio
  await prisma.involucrado.deleteMany({ where: { incidenteId } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('POST /incidentes/:id/involucrados', () => {

  it('Se pueden agregar múltiples involucrados a un mismo incidente', async () => {
    // Agregar primer involucrado
    const res1 = await request(app)
      .post(`/incidentes/${incidenteId}/involucrados`)
      .send({ estudianteId, rol: 'AFECTADO' })

    expect(res1.status).toBe(201)
    expect(res1.body.rol).toBe('AFECTADO')
    expect(res1.body.estudianteId).toBe(estudianteId)

    // Agregar segundo involucrado (distinto estudiante, distinto rol)
    const res2 = await request(app)
      .post(`/incidentes/${incidenteId}/involucrados`)
      .send({ estudianteId: estudiante2Id, rol: 'TESTIGO' })

    expect(res2.status).toBe(201)
    expect(res2.body.rol).toBe('TESTIGO')
  })

  it('El rol acepta solo los valores válidos del enum', async () => {
    const res = await request(app)
      .post(`/incidentes/${incidenteId}/involucrados`)
      .send({ estudianteId, rol: 'ROL_INVALIDO' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/no es válido/)
  })

  it('Retorna 404 si el incidente no existe', async () => {
    const res = await request(app)
      .post('/incidentes/999999/involucrados')
      .send({ estudianteId, rol: 'TESTIGO' })

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/incidente/)
  })

  it('Retorna 404 si el estudiante no existe', async () => {
    const res = await request(app)
      .post(`/incidentes/${incidenteId}/involucrados`)
      .send({ estudianteId: 999999, rol: 'TESTIGO' })

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/estudiante/)
  })

  it('Retorna 409 si se intenta registrar el mismo estudiante con el mismo rol dos veces', async () => {
    // Primera vez: debe funcionar
    await request(app)
      .post(`/incidentes/${incidenteId}/involucrados`)
      .send({ estudianteId, rol: 'RESPONSABLE' })

    // Segunda vez con el mismo par (estudianteId, rol): 409
    const res = await request(app)
      .post(`/incidentes/${incidenteId}/involucrados`)
      .send({ estudianteId, rol: 'RESPONSABLE' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/ya está registrado/)
  })

  it('Retorna 400 si falta el campo estudianteId', async () => {
    const res = await request(app)
      .post(`/incidentes/${incidenteId}/involucrados`)
      .send({ rol: 'TESTIGO' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/estudianteId/)
  })

  it('Retorna 400 si falta el campo rol', async () => {
    const res = await request(app)
      .post(`/incidentes/${incidenteId}/involucrados`)
      .send({ estudianteId })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/rol/)
  })

  it('El involucrado creado incluye los datos del estudiante en la respuesta', async () => {
    // Limpiar INTERVINIENTE previo si existe
    await prisma.involucrado.deleteMany({
      where: { incidenteId, estudianteId: estudiante2Id, rol: 'INTERVINIENTE' },
    })

    const res = await request(app)
      .post(`/incidentes/${incidenteId}/involucrados`)
      .send({ estudianteId: estudiante2Id, rol: 'INTERVINIENTE', observacion: 'Separó la pelea' })

    expect(res.status).toBe(201)
    expect(res.body.estudiante).toBeDefined()
    expect(res.body.estudiante.id).toBe(estudiante2Id)
    expect(res.body.observacion).toBe('Separó la pelea')
  })
})
