/**
 * Tests — Tarea 5: GET /estudiantes/:id/incidentes
 * Valida los criterios de aceptación del Sprint Backlog (HU3/HU5).
 *
 *
 * Ejecutar: npm test
 * Requiere seed ejecutado previamente: npm run db:seed
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

let estudianteConIncidentes: number   // Martín — tiene 2 incidentes en el seed
let estudianteSinIncidentes: number   // Estudiante nuevo sin incidentes

beforeAll(async () => {
  // Martín es el responsable en ambos incidentes del seed
  const martin = await prisma.estudiante.findFirst({
    where: { nombres: 'Martín' },
  })
  if (!martin) throw new Error('Ejecuta el seed antes de correr los tests: npm run db:seed')
  estudianteConIncidentes = martin.id

  // Crear un estudiante limpio sin incidentes para el test de lista vacía
  const nuevo = await prisma.estudiante.upsert({
    where: { rut: '99999999-9' },
    update: {},
    create: { rut: '99999999-9', nombres: 'Test', apellidos: 'Sin Incidentes', curso: '4°D' },
  })
  estudianteSinIncidentes = nuevo.id
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('GET /estudiantes/:id/incidentes', () => {

  it('Retorna historial de incidentes con el rol del estudiante en cada uno', async () => {
    const res = await request(app).get(`/estudiantes/${estudianteConIncidentes}/incidentes`)

    expect(res.status).toBe(200)
    expect(res.body.incidentes).toBeInstanceOf(Array)
    expect(res.body.incidentes.length).toBeGreaterThan(0)

    // Cada elemento debe traer el rol
    for (const item of res.body.incidentes) {
      expect(item.rol).toBeDefined()
      expect(item.incidente).toBeDefined()
    }
  })

  it('Si el estudiante no tiene incidentes, retorna lista vacía [] con 200 OK', async () => {
    const res = await request(app).get(`/estudiantes/${estudianteSinIncidentes}/incidentes`)

    expect(res.status).toBe(200)
    expect(res.body.incidentes).toEqual([])
    expect(res.body.totalIncidentes).toBe(0)
  })

  it('Si el estudiante no existe, retorna 404', async () => {
    const res = await request(app).get('/estudiantes/999999/incidentes')

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/estudiante/)
  })

  it('Los incidentes están ordenados por fecha descendente', async () => {
    const res = await request(app).get(`/estudiantes/${estudianteConIncidentes}/incidentes`)

    expect(res.status).toBe(200)
    const fechas: Date[] = res.body.incidentes.map((i: any) => new Date(i.incidente.fecha))

    for (let idx = 1; idx < fechas.length; idx++) {
      // Cada fecha debe ser <= la anterior (descendente)
      expect(fechas[idx].getTime()).toBeLessThanOrEqual(fechas[idx - 1].getTime())
    }
  })

  it('Cada incidente incluye fecha, tipo, gravedad y descripción', async () => {
    const res = await request(app).get(`/estudiantes/${estudianteConIncidentes}/incidentes`)

    expect(res.status).toBe(200)
    for (const item of res.body.incidentes) {
      expect(item.incidente.fecha).toBeDefined()
      expect(item.incidente.tipo).toBeDefined()
      expect(item.incidente.gravedad).toBeDefined()
      expect(item.incidente.descripcion).toBeDefined()
    }
  })

  it('La respuesta incluye datos del estudiante consultado', async () => {
    const res = await request(app).get(`/estudiantes/${estudianteConIncidentes}/incidentes`)

    expect(res.status).toBe(200)
    expect(res.body.estudiante).toBeDefined()
    expect(res.body.estudiante.id).toBe(estudianteConIncidentes)
  })

  it('Filtra correctamente por tipo de incidente (query param ?tipo=)', async () => {
    const res = await request(app)
      .get(`/estudiantes/${estudianteConIncidentes}/incidentes`)
      .query({ tipo: 'AGRESION_FISICA' })

    expect(res.status).toBe(200)
    for (const item of res.body.incidentes) {
      expect(item.incidente.tipo).toBe('AGRESION_FISICA')
    }
  })

  it('Filtra correctamente por gravedad (query param ?gravedad=)', async () => {
    const res = await request(app)
      .get(`/estudiantes/${estudianteConIncidentes}/incidentes`)
      .query({ gravedad: 'GRAVE' })

    expect(res.status).toBe(200)
    for (const item of res.body.incidentes) {
      expect(item.incidente.gravedad).toBe('GRAVE')
    }
  })

  it('Retorna 400 si el id no es numérico', async () => {
    const res = await request(app).get('/estudiantes/abc/incidentes')

    expect(res.status).toBe(400)
  })
})
