/**
 * Configuración de Seguridad - Middlewares
 * Implementa OWASP Top 10 mitigations
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * Configura todos los middlewares de seguridad
 * @param {Express} app - Instancia de Express
 */
export function configureSecurityMiddleware(app) {
  // ===========================================
  // 1. Helmet - Headers de Seguridad
  // ===========================================
  // Protege contra: XSS, clickjacking, sniffing, etc.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // React necesita inline styles
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"], // Previene clickjacking
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false, // Desactivar para desarrollo local
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false
  }));

  // ===========================================
  // 2. CORS - Control de Origen
  // ===========================================
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Permitir cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 600 // Cache preflight 10 minutos
  };

  app.use(cors(corsOptions));
  logger.info(`CORS configurado para origen: ${corsOptions.origin}`);

  // ===========================================
  // 3. Rate Limiting - Global
  // ===========================================
  const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Demasiadas peticiones. Por favor, espera unos minutos.',
      retryAfter: 'Ver header Retry-After'
    },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit excedido para IP: ${req.ip}`);
      res.status(429).json(options.message);
    }
  });

  app.use(globalLimiter);

  // ===========================================
  // 4. Trust Proxy (para obtener IP real)
  // ===========================================
  // Solo activar si estás detrás de un proxy/load balancer
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // ===========================================
  // 5. Desactivar X-Powered-By
  // ===========================================
  app.disable('x-powered-by');

  logger.info('Middlewares de seguridad configurados');
}

/**
 * Rate limiter específico para login
 * Más restrictivo: 5 intentos por 15 minutos
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Solo cuenta intentos fallidos
  message: {
    error: 'Demasiados intentos de login. Espera 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Login rate limit excedido para IP: ${req.ip}, usuario intentado: ${req.body?.username || 'desconocido'}`);
    res.status(429).json(options.message);
  }
});

/**
 * Rate limiter para registro
 * Evita spam de cuentas: 3 registros por hora por IP
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Has creado demasiadas cuentas. Espera una hora.',
    code: 'REGISTRATION_LIMIT_EXCEEDED'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Register rate limit excedido para IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});
