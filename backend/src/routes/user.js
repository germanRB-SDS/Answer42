/**
 * Rutas de Usuario (protegidas)
 * GET /api/user/profile - Obtener perfil completo para dashboard
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as userService from '../services/userService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

/**
 * GET /api/user/profile
 * Obtiene el perfil del usuario para el dashboard post-login
 * Incluye: username, hash (demo), IP history, device history
 */
router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const profile = await userService.getUserProfile(userId);

    logger.info(`Perfil consultado: user_id=${userId}`);

    res.json({
      user: profile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/history
 * Obtiene el historial de IPs y dispositivos
 */
router.get('/history', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const history = await userService.getUserHistory(userId);

    res.json(history);
  } catch (error) {
    next(error);
  }
});

export default router;
