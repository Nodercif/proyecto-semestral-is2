/**
 * GET /estudiantes/:id/incidentes
 * Versión JS para ser importada desde index.js
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/:id/incidentes', async (req, res) => {
  const estudianteId = parseInt(req.params.id, 10)

  if (isNaN(estudianteId)) {
    return res.status(400).json({ error: 'El parámetro id debe ser un número entero.' })
  }

  const estudiante = await prisma.estudiante.findUnique({
    where: { id: estudianteId },
    select: { id: true, nombres: true, apellidos: true, curso: true },
  })

  if (!estudiante) {
    return res.status(404).json({ error: `No existe un estudiante con id ${estudianteId}.` })
  }

  const { tipo, gravedad, desde, hasta } = req.query

  const fechaFiltro = {}
  if (desde) {
    const d = new Date(desde)
    if (isNaN(d.getTime())) {
      return res.status(400).json({ error: 'El parámetro "desde" no es una fecha válida.' })
    }
    fechaFiltro.gte = d
  }
  if (hasta) {
    const h = new Date(hasta)
    if (isNaN(h.getTime())) {
      return res.status(400).json({ error: 'El parámetro "hasta" no es una fecha válida.' })
    }
    fechaFiltro.lte = h
  }

  const involucrados = await prisma.involucrado.findMany({
    where: {
      estudianteId,
      incidente: {
        ...(tipo ? { tipo } : {}),
        ...(gravedad ? { gravedad } : {}),
        ...(Object.keys(fechaFiltro).length > 0 ? { fecha: fechaFiltro } : {}),
      },
    },
    include: {
      incidente: {
        select: {
          id: true,
          fecha: true,
          descripcion: true,
          tipo: true,
          gravedad: true,
          registradoPor: {
            select: { id: true, nombres: true, apellidos: true, cargo: true },
          },
        },
      },
    },
    orderBy: {
      incidente: { fecha: 'desc' },
    },
  })

  const historial = involucrados.map((inv) => ({
    rol: inv.rol,
    observacion: inv.observacion,
    incidente: inv.incidente,
  }))

  res.status(200).json({
    estudiante,
    totalIncidentes: historial.length,
    incidentes: historial,
  })
})

router.get('/curso/:curso/incidentes', async (req, res) => {
  const curso = decodeURIComponent(req.params.curso)

  const estudiantes = await prisma.estudiante.findMany({
    where: { curso },
    select: { id: true, nombres: true, apellidos: true, curso: true },
  })

  if (estudiantes.length === 0) {
    return res.status(404).json({ error: `No existe ningún estudiante en el curso "${curso}".` })
  }

  const { tipo, gravedad, rolInvolucrado, desde, hasta } = req.query

  const fechaFiltro = {}
  if (desde) {
    const d = new Date(desde)
    if (isNaN(d.getTime())) return res.status(400).json({ error: 'El parámetro "desde" no es una fecha válida.' })
    fechaFiltro.gte = d
  }
  if (hasta) {
    const h = new Date(hasta)
    if (isNaN(h.getTime())) return res.status(400).json({ error: 'El parámetro "hasta" no es una fecha válida.' })
    fechaFiltro.lte = h
  }

  const estudianteIds = estudiantes.map(e => e.id)
  const estudianteMap  = Object.fromEntries(estudiantes.map(e => [e.id, e]))

  const involucrados = await prisma.involucrado.findMany({
    where: {
      estudianteId: { in: estudianteIds },
      ...(rolInvolucrado ? { rol: rolInvolucrado } : {}),
      incidente: {
        ...(tipo     ? { tipo }     : {}),
        ...(gravedad ? { gravedad } : {}),
        ...(Object.keys(fechaFiltro).length > 0 ? { fecha: fechaFiltro } : {}),
      },
    },
    include: {
      incidente: {
        select: {
          id: true,
          fecha: true,
          descripcion: true,
          tipo: true,
          gravedad: true,
          registradoPor: {
            select: { id: true, nombres: true, apellidos: true, cargo: true },
          },
        },
      },
    },
    orderBy: { incidente: { fecha: 'desc' } },
  })

  const incidentes = involucrados.map(inv => ({
    rol:        inv.rol,
    observacion: inv.observacion,
    incidente:  inv.incidente,
    estudiante: estudianteMap[inv.estudianteId],
  }))

  res.status(200).json({
    curso,
    totalEstudiantes: estudiantes.length,
    totalIncidentes:  incidentes.length,
    incidentes,
  })
})

export default router