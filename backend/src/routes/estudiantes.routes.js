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

export default router