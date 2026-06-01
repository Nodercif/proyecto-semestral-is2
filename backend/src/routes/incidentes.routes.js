
import { Router } from 'express';

import authenticate from '../middlewares/authenticate.js';
import { authorize, ROLES } from '../middlewares/authorize.js';
const router = Router();

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// ── Aplicar autenticación a TODAS las rutas ────────────────────────────────
router.use(authenticate);

// ── GET /incidentes ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({
    message: 'Listado de incidentes',
    usuario: req.usuario,
  });
});

// ── POST /incidentes ───────────────────────────────────────────────────────
router.post(
  '/',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR,
    ROLES.DOCENTE,
    ROLES.ORIENTADOR,
    ROLES.EQUIPO_DIRECTIVO
  ),
  async (req, res) => {
    const { fecha, descripcion, tipo, gravedad } = req.body
    const registradoPorId = req.usuario.funcionarioId  // viene del token JWT
    try {
      const incidente = await prisma.incidente.create({
        data: { fecha: new Date(fecha), descripcion, tipo, gravedad, registradoPorId }
      })
      res.status(201).json(incidente)
    } catch (error) {
      console.error('Error al crear incidente:', error)
      res.status(500).json({ error: 'Error al crear el incidente' })
    }
  }
)

// ── DELETE /incidentes/:id ────────────────────────────────────────────────
router.delete(
  '/:id',
  authorize(ROLES.ADMINISTRADOR),
  (req, res) => {
    res.json({
      message: `Incidente ${req.params.id} eliminado (stub)`,
    });
  }
);

export default router;