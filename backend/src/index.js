/**
 * Answer42 - Backend Principal
 * Servidor Express con configuración de seguridad OWASP
 */

import 'dotenv/config';
import express from 'express';
import { configureSecurityMiddleware } from './config/security.js';
import { configureSession } from './config/session.js';
import { initializeDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// 1. Inicializar Base de Datos
// ===========================================
try {
  initializeDatabase();
  logger.info('Base de datos inicializada correctamente');
} catch (error) {
  logger.error('Error al inicializar base de datos:', error);
  process.exit(1);
}

// ===========================================
// 2. Middlewares de Seguridad
// ===========================================
configureSecurityMiddleware(app);

// ===========================================
// 3. Body Parsers (después de seguridad)
// ===========================================
app.use(express.json({ limit: '10kb' })); // Limitar tamaño de body
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ===========================================
// 4. Sesiones
// ===========================================
configureSession(app);

// ===========================================
// 5. Rutas
// ===========================================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health check (sin autenticación)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ===========================================
// 6. Manejo de Errores
// ===========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ===========================================
// 7. Iniciar Servidor
// ===========================================
app.listen(PORT, () => {
  logger.info(`Servidor Answer42 ejecutándose en http://localhost:${PORT}`);
  logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Frontend esperado en: ${process.env.FRONTEND_URL}`);
});

export default app;
