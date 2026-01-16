/**
 * Rutas de Autenticación
 * POST /api/auth/register - Registro de usuario
 * POST /api/auth/login    - Inicio de sesión
 * POST /api/auth/logout   - Cierre de sesión
 * GET  /api/auth/csrf     - Obtener token CSRF
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate.js';
import { loginRateLimiter, registerRateLimiter } from '../config/security.js';
import { requireAuth } from '../middleware/auth.js';
import * as authService from '../services/authService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ===========================================
// Validaciones
// ===========================================

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Usuario debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Usuario solo puede contener letras, números, guión bajo y guión'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Contraseña debe incluir mayúscula, minúscula y número'),

  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden')
];

const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Usuario requerido'),

  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida')
];

// ===========================================
// Rutas
// ===========================================

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
router.post(
  '/register',
  registerRateLimiter,
  registerValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      const ip = req.ip;
      const userAgent = req.get('User-Agent') || 'unknown';
      const deviceHash = req.body.deviceHash || 'unknown';

      const result = await authService.registerUser({
        username,
        email,
        password,
        ip,
        userAgent,
        deviceHash
      });

      logger.info(`Usuario registrado: ${username}`);

      res.status(201).json({
        message: 'Usuario registrado correctamente',
        user: {
          id: result.id,
          username: result.username
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Inicia sesión
 */
router.post(
  '/login',
  loginRateLimiter,
  loginValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const ip = req.ip;
      const userAgent = req.get('User-Agent') || 'unknown';
      const deviceHash = req.body.deviceHash || 'unknown';

      const result = await authService.loginUser({
        username,
        password,
        ip,
        userAgent,
        deviceHash
      });

      // Guardar en sesión
      req.session.userId = result.user.id;
      req.session.username = result.user.username;

      logger.info(`Login exitoso: ${username} desde IP ${ip}`);

      res.json({
        message: 'Login exitoso',
        user: result.user,
        alerts: result.alerts
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Cierra la sesión actual
 */
router.post('/logout', requireAuth, (req, res) => {
  const username = req.session.username;

  req.session.destroy((err) => {
    if (err) {
      logger.error('Error al cerrar sesión:', err);
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }

    res.clearCookie('sid');
    logger.info(`Logout: ${username}`);
    res.json({ message: 'Sesión cerrada correctamente' });
  });
});

/**
 * GET /api/auth/session
 * Verifica si hay sesión activa
 */
router.get('/session', (req, res) => {
  if (req.session?.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
