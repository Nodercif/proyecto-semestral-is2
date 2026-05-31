import { Router } from 'express';

import authenticate from '../../backend/src/middlewares/authenticate.js';
import { authorize, ROLES } from '../../backend/src/middlewares/authorize.js';

const router = Router();

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
  (req, res) => {
    res.status(201).json({
      message: 'Incidente creado (stub)',
    });
  }
);

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