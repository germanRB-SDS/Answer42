/**
 * Logger centralizado con Winston
 * Configurado para no filtrar información sensible
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato personalizado
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Filtrar información sensible de los logs
const sensitiveFields = ['password', 'password_hash', 'secret', 'token', 'authorization'];

const filterSensitive = winston.format((info) => {
  if (typeof info.message === 'object') {
    const filtered = { ...info.message };
    sensitiveFields.forEach(field => {
      if (filtered[field]) {
        filtered[field] = '[REDACTED]';
      }
    });
    info.message = filtered;
  }
  return info;
});

// Crear logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    filterSensitive(),
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Consola (desarrollo)
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    }),

    // Archivo de errores
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Archivo combinado
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],

  // No salir en excepciones no capturadas
  exitOnError: false
});

// Crear directorio de logs si no existe
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs', { recursive: true });
} catch (e) {
  // Directorio ya existe
}
