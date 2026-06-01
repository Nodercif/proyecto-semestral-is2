import { Router } from 'express';

import authenticate from '../middlewares/authenticate.js';
import { authorize, ROLES } from '../middlewares/authorize.js';
const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /involucrados
 * Roles con acceso de lectura
 */
router.get(
  '/',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR,
    ROLES.ORIENTADOR,
    ROLES.EQUIPO_DIRECTIVO
  ),
  (req, res) => {
    res.json({
      message: 'Listado de involucrados (stub)',
    });
  }
);

/**
 * POST /involucrados
 * Solo roles operativos pueden registrar involucrados
 */
router.post(
  '/:id/involucrados',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR
  ),
  async (req, res) => {
    const { default: prismaClient } = await import('../config/prisma.js')
    const { RolInvolucrado, Prisma } = await import('@prisma/client')
    
    const incidenteId = parseInt(req.params.id, 10)
    const { estudianteId, rol, observacion, funcionarioIntervinienteId } = req.body

    if (isNaN(incidenteId)) {
      return res.status(400).json({ error: 'El parámetro id debe ser un número entero.' })
    }
    if (!estudianteId || !rol) {
      return res.status(400).json({ error: 'estudianteId y rol son obligatorios.' })
    }

    try {
      const involucrado = await prismaClient.involucrado.create({
        data: {
          incidenteId,
          estudianteId: parseInt(estudianteId),
          rol,
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
      if (error?.code === 'P2002') {
        return res.status(409).json({ error: 'El estudiante ya está registrado con ese rol en este incidente.' })
      }
      console.error('Error al registrar involucrado:', error)
      res.status(500).json({ error: 'Error al registrar involucrado.' })
    }
  }
)

export default router;