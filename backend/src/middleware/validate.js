/**
 * Middleware de Validación
 * Procesa resultados de express-validator
 */

import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Valida los resultados de express-validator
 * Lanza ValidationError si hay errores
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    logger.warn(`Validación fallida: ${JSON.stringify(errorDetails)}`);

    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      code: 'VALIDATION_ERROR',
      details: errorDetails
    });
  }

  next();
}

/**
 * Sanitiza strings para prevenir XSS
 * (express-validator ya hace escape, esto es capa adicional)
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
