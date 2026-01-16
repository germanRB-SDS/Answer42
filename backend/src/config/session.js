/**
 * Configuración de Sesiones
 * Cookies seguras con almacenamiento en SQLite
 */

import session from 'express-session';
import SQLiteStoreFactory from 'connect-sqlite3';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLiteStore = SQLiteStoreFactory(session);

/**
 * Configura el middleware de sesiones
 * @param {Express} app - Instancia de Express
 */
export function configureSession(app) {
  // Cookie parser necesario para CSRF
  app.use(cookieParser());

  // Validar que existe SESSION_SECRET
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.includes('CAMBIAR')) {
    logger.error('⚠️  SESSION_SECRET no configurado. Genera uno con:');
    logger.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');

    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET es obligatorio en producción');
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const sessionConfig = {
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: path.join(__dirname, '../../data'),
      table: 'sessions'
    }),

    // Secreto para firmar la cookie de sesión
    secret: process.env.SESSION_SECRET || 'dev-secret-cambiar-en-produccion',

    // Nombre genérico (no revela tecnología)
    name: 'sid',

    // No guardar sesiones vacías
    resave: false,
    saveUninitialized: false,

    // Configuración de cookie segura
    cookie: {
      httpOnly: true,           // ✅ Inaccesible desde JavaScript (protege XSS)
      secure: isProduction,     // ✅ Solo HTTPS en producción
      sameSite: 'strict',       // ✅ Protección CSRF
      maxAge: parseInt(process.env.SESSION_MAX_AGE_MS) || 24 * 60 * 60 * 1000, // 24h
      path: '/'
    },

    // Rolling: renueva el maxAge en cada request
    rolling: true
  };

  app.use(session(sessionConfig));

  logger.info('Sesiones configuradas con SQLite store');
  logger.info(`Cookie flags: httpOnly=${sessionConfig.cookie.httpOnly}, secure=${sessionConfig.cookie.secure}, sameSite=${sessionConfig.cookie.sameSite}`);
}
