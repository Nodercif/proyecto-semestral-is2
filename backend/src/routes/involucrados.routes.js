import { Router } from 'express';

import authenticate from '../../backend/src/middlewares/authenticate.js';
import { authorize, ROLES } from '../../backend/src/middlewares/authorize.js';

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
  '/',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR
  ),
  (req, res) => {
    res.status(201).json({
      message: 'Involucrado registrado (stub)',
    });
  }
);

export default router;