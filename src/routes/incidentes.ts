/**
 * Tarea 4: Endpoint — Registrar involucrados en un incidente (HU2)
 * POST /incidentes/:id/involucrados
 *
 * Permite asociar estudiantes a un incidente con un rol específico
 * (afectado, responsable, testigo, interviniente).
 * Valida que el incidente y el estudiante existan.
 *
 * Autor: Ignacio Jara Valdebenito
 */

import { Router, Request, Response } from 'express'
import { PrismaClient, RolInvolucrado, Prisma } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Valores válidos para el rol del involucrado
const ROLES_VALIDOS: RolInvolucrado[] = [
  RolInvolucrado.AFECTADO,
  RolInvolucrado.RESPONSABLE,
  RolInvolucrado.TESTIGO,
  RolInvolucrado.INTERVINIENTE,
]

/**
 * POST /incidentes/:id/involucrados
 * Asocia un estudiante a un incidente con un rol determinado.
 *
 * Body esperado:
 * {
 *   estudianteId: number,
 *   rol: "AFECTADO" | "RESPONSABLE" | "TESTIGO" | "INTERVINIENTE",
 *   observacion?: string,
 *   funcionarioIntervinienteId?: number   (solo si rol = INTERVINIENTE)
 * }
 */
router.post('/:id/involucrados', async (req: Request, res: Response) => {
  const incidenteId = parseInt(req.params.id, 10)

  // Validar que el id de la URL sea numérico
  if (isNaN(incidenteId)) {
    res.status(400).json({ error: 'El parámetro id debe ser un número entero.' })
    return
  }

  const { estudianteId, rol, observacion, funcionarioIntervinienteId } = req.body

  // ── Validaciones de campos obligatorios ──────────────────────────────────

  if (estudianteId === undefined || estudianteId === null) {
    res.status(400).json({ error: 'El campo estudianteId es obligatorio.' })
    return
  }

  if (typeof estudianteId !== 'number' || !Number.isInteger(estudianteId)) {
    res.status(400).json({ error: 'estudianteId debe ser un número entero.' })
    return
  }

  if (!rol) {
    res.status(400).json({ error: 'El campo rol es obligatorio.' })
    return
  }

  if (!ROLES_VALIDOS.includes(rol as RolInvolucrado)) {
    res.status(400).json({
      error: `El rol '${rol}' no es válido. Los valores permitidos son: ${ROLES_VALIDOS.join(', ')}.`,
    })
    return
  }

  // ── Verificar existencia del incidente ───────────────────────────────────

  const incidente = await prisma.incidente.findUnique({
    where: { id: incidenteId },
  })

  if (!incidente) {
    res.status(404).json({ error: `No existe un incidente con id ${incidenteId}.` })
    return
  }

  // ── Verificar existencia del estudiante ──────────────────────────────────

  const estudiante = await prisma.estudiante.findUnique({
    where: { id: estudianteId },
  })

  if (!estudiante) {
    res.status(404).json({ error: `No existe un estudiante con id ${estudianteId}.` })
    return
  }

  // ── Verificar funcionario interviniente si corresponde ───────────────────

  if (funcionarioIntervinienteId !== undefined && funcionarioIntervinienteId !== null) {
    const funcionario = await prisma.funcionarioInstitucional.findUnique({
      where: { id: funcionarioIntervinienteId },
    })
    if (!funcionario) {
      res.status(404).json({
        error: `No existe un funcionario con id ${funcionarioIntervinienteId}.`,
      })
      return
    }
  }

  // ── Crear el involucrado ──────────────────────────────────────────────────

  try {
    const involucrado = await prisma.involucrado.create({
      data: {
        incidenteId,
        estudianteId,
        rol: rol as RolInvolucrado,
        observacion: observacion ?? null,
        funcionarioIntervinienteId: funcionarioIntervinienteId ?? null,
      },
      include: {
        estudiante: {
          select: { id: true, nombres: true, apellidos: true, curso: true },
        },
      },
    })

    res.status(201).json(involucrado)
  } catch (error) {
    // Violación de restricción única: mismo estudiante + mismo rol + mismo incidente
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      res.status(409).json({
        error: `El estudiante con id ${estudianteId} ya está registrado con el rol '${rol}' en este incidente.`,
      })
      return
    }
    throw error
  }
})

export default router
