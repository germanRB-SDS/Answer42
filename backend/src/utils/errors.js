/**
 * Manejo de Errores Centralizado
 * IMPORTANTE: No filtrar información sensible al cliente
 */

import { logger } from './logger.js';

/**
 * Clase base para errores de la aplicación
 */
export class AppError extends Error {
  constructor(message, statusCode, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de validación
 */
export class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * Error de autenticación
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Credenciales inválidas') {
    // Mensaje genérico para no revelar si el usuario existe
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Error de autorización
 */
export class AuthorizationError extends AppError {
  constructor(message = 'No tienes permiso para realizar esta acción') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Error de recurso no encontrado
 */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Middleware para rutas no encontradas
 */
export function notFoundHandler(req, res, next) {
  logger.warn(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Endpoint no encontrado',
    code: 'NOT_FOUND'
  });
}

/**
 * Middleware de manejo de errores global
 * CRÍTICO: No exponer detalles internos al cliente
 */
export function errorHandler(err, req, res, next) {
  // Log completo del error (interno)
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.session?.userId
  });

  // Determinar código de estado
  const statusCode = err.statusCode || err.status || 500;

  // Respuesta al cliente (NUNCA incluir stack trace)
  const response = {
    error: err.isOperational ? err.message : 'Ha ocurrido un error interno',
    code: err.code || 'INTERNAL_ERROR'
  };

  // Incluir detalles de validación si existen
  if (err instanceof ValidationError && err.details) {
    response.details = err.details;
  }

  // En desarrollo, añadir más info (pero NUNCA en producción)
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    response.debug = {
      message: err.message,
      // NUNCA incluir stack en respuesta, ni en desarrollo
    };
  }

  res.status(statusCode).json(response);
}
