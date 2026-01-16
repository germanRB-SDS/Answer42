/**
 * Middleware de Autenticación
 * Verifica que el usuario tenga una sesión válida
 */

import { AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Requiere que el usuario esté autenticado
 * Verifica la sesión y rechaza si no existe
 */
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    logger.warn(`Acceso no autorizado a ${req.originalUrl} desde IP ${req.ip}`);
    return res.status(401).json({
      error: 'Debes iniciar sesión para acceder a este recurso',
      code: 'UNAUTHORIZED'
    });
  }

  next();
}

/**
 * Middleware opcional que añade usuario a request si existe sesión
 * No bloquea si no hay sesión
 */
export function optionalAuth(req, res, next) {
  if (req.session?.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.username
    };
  }
  next();
}
