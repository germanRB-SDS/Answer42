/**
 * Servicio de Auditoría
 * Registra todas las acciones relevantes de seguridad
 */

import { getDb } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Registra una acción en el log de auditoría
 */
export async function logAction({
  userId,
  action,
  ip,
  deviceHash,
  userAgent,
  details = {},
  success = true
}) {
  try {
    const db = getDb();

    const stmt = db.prepare(`
      INSERT INTO audit_log (user_id, action, ip_address, device_hash, user_agent, details, success)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      action,
      ip,
      deviceHash,
      userAgent,
      JSON.stringify(details),
      success ? 1 : 0
    );

    logger.debug(`Audit: ${action} - user_id=${userId} - success=${success}`);
  } catch (error) {
    // No fallar la operación principal por error de auditoría
    logger.error('Error al registrar auditoría:', error);
  }
}

/**
 * Obtiene el historial de auditoría de un usuario
 */
export async function getAuditHistory(userId, limit = 50) {
  const db = getDb();

  const logs = db.prepare(`
    SELECT *
    FROM audit_log
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit);

  return logs.map(log => ({
    ...log,
    details: JSON.parse(log.details || '{}'),
    success: Boolean(log.success)
  }));
}

/**
 * Obtiene intentos de login fallidos recientes (para monitoreo)
 */
export async function getRecentFailedLogins(minutes = 15) {
  const db = getDb();

  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

  const logs = db.prepare(`
    SELECT ip_address, COUNT(*) as attempts, MAX(created_at) as last_attempt
    FROM audit_log
    WHERE action = 'LOGIN_FAILED'
      AND created_at > ?
    GROUP BY ip_address
    HAVING attempts >= 3
    ORDER BY attempts DESC
  `).all(cutoff);

  return logs;
}
