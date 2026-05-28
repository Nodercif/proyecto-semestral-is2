/**
 * Tarea 5: Endpoint — Consultar historial de incidentes de un estudiante (HU5)
 * GET /estudiantes/:id/incidentes
 *
 * Retorna todos los incidentes en los que ha participado un estudiante,
 * indicando en cada uno su rol (afectado, responsable, testigo, interviniente),
 * junto con fecha, tipo y gravedad. Ordenados por fecha descendente.
 *
 * Autor: Ignacio Jara Valdebenito
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

/**
 * GET /estudiantes/:id/incidentes
 * Retorna el historial de incidentes del estudiante indicado.
 *
 * Query params opcionales (para filtrado — CA6):
 *   - tipo:     TipoIncidente (CONFLICTO, AGRESION_FISICA, AGRESION_VERBAL, ACOSO, DANO_MATERIAL)
 *   - gravedad: NivelGravedad (LEVE, MODERADO, GRAVE, MUY_GRAVE)
 *   - desde:    fecha ISO (ej: 2026-01-01)
 *   - hasta:    fecha ISO (ej: 2026-12-31)
 */
router.get('/:id/incidentes', async (req: Request, res: Response) => {
  const estudianteId = parseInt(req.params.id, 10)

  if (isNaN(estudianteId)) {
    res.status(400).json({ error: 'El parámetro id debe ser un número entero.' })
    return
  }

  // ── Verificar existencia del estudiante ──────────────────────────────────

  const estudiante = await prisma.estudiante.findUnique({
    where: { id: estudianteId },
    select: { id: true, nombres: true, apellidos: true, curso: true },
  })

  if (!estudiante) {
    res.status(404).json({ error: `No existe un estudiante con id ${estudianteId}.` })
    return
  }

  // ── Filtros opcionales ────────────────────────────────────────────────────

  const { tipo, gravedad, desde, hasta } = req.query

  // Construir filtro de fecha si se pasan parámetros
  const fechaFiltro: Record<string, Date> = {}
  if (desde) {
    const d = new Date(desde as string)
    if (isNaN(d.getTime())) {
      res.status(400).json({ error: 'El parámetro "desde" no es una fecha válida (use formato ISO).' })
      return
    }
    fechaFiltro.gte = d
  }
  if (hasta) {
    const h = new Date(hasta as string)
    if (isNaN(h.getTime())) {
      res.status(400).json({ error: 'El parámetro "hasta" no es una fecha válida (use formato ISO).' })
      return
    }
    fechaFiltro.lte = h
  }

  // ── Consulta principal ────────────────────────────────────────────────────

  const involucrados = await prisma.involucrado.findMany({
    where: {
      estudianteId,
      incidente: {
        ...(tipo ? { tipo: tipo as any } : {}),
        ...(gravedad ? { gravedad: gravedad as any } : {}),
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

  // ── Formatear respuesta ───────────────────────────────────────────────────

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
