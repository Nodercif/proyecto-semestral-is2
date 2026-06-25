import { Router } from 'express'
import authenticate from '../middlewares/authenticate.js'
import { authorize, ROLES } from '../middlewares/authorize.js'
import * as casoController from '../controllers/casoController.js'

const router = Router()

// Aplicar autenticación a TODAS las rutas
router.use(authenticate)

// POST /casos
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
  casoController.crearCaso
)

// POST /casos/:id/incidentes
router.post(
  '/:id/incidentes',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR,
    ROLES.DOCENTE,
    ROLES.ORIENTADOR,
    ROLES.EQUIPO_DIRECTIVO
  ),
  casoController.asociarIncidente
)

// GET /casos/:id
router.get(
  '/:id',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR,
    ROLES.DOCENTE,
    ROLES.ORIENTADOR,
    ROLES.EQUIPO_DIRECTIVO
  ),
  casoController.obtenerCaso
)

// GET /casos
router.get(
  '/',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR,
    ROLES.DOCENTE,
    ROLES.ORIENTADOR,
    ROLES.EQUIPO_DIRECTIVO
  ),
  casoController.listarCasos
)

export default router