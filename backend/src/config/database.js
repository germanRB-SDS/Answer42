/**
 * Configuración de Base de Datos SQLite
 * Usa better-sqlite3 para queries síncronas y prepared statements
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/answer42.db');

let db = null;

/**
 * Obtiene la instancia de la base de datos (singleton)
 * @returns {Database} Instancia de better-sqlite3
 */
export function getDb() {
  if (!db) {
    db = new Database(DB_PATH, {
      verbose: process.env.NODE_ENV === 'development' ?
        (msg) => logger.debug(`SQL: ${msg}`) : null
    });

    // Configuración de seguridad y rendimiento
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging
    db.pragma('foreign_keys = ON');   // Integridad referencial
    db.pragma('busy_timeout = 5000'); // Timeout de 5 segundos
  }
  return db;
}

/**
 * Inicializa las tablas de la base de datos
 */
export function initializeDatabase() {
  const db = getDb();

  // ===========================================
  // Tabla: users
  // ===========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      ip_history TEXT DEFAULT '[]',
      device_history TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME
    )
  `);

  // Índices para búsquedas frecuentes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // ===========================================
  // Tabla: audit_log
  // ===========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      ip_address TEXT,
      device_hash TEXT,
      user_agent TEXT,
      details TEXT,
      success INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Índice para consultas de auditoría
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
  `);

  logger.info(`Base de datos inicializada en: ${DB_PATH}`);
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
    logger.info('Conexión a base de datos cerrada');
  }
}

// Cerrar conexión al terminar el proceso
process.on('exit', closeDb);
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});
