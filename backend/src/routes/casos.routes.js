import { Router } from 'express';
import casoController from '../controllers/casoController.js';
import authenticate from '../middlewares/authenticate.js';
import { authorize, ROLES } from '../middlewares/authorize.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR,
    ROLES.EQUIPO_DIRECTIVO
  ),
  casoController.crearCaso
);

router.get('/', casoController.listarCasos);

router.get('/:id', casoController.obtenerCaso);

router.post(
  '/:id/incidentes',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR,
    ROLES.EQUIPO_DIRECTIVO
  ),
  casoController.asociarIncidente
);

export default router;