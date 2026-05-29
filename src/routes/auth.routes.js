import { Router } from 'express';

import { login, me } from '../controllers/auth.controller.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

/**
 * POST /auth/login
 * Pública – no requiere token
 */
router.post('/login', login);

/**
 * GET /auth/me
 * Privada – requiere token válido
 */
router.get('/me', authenticate, me);

export default router;