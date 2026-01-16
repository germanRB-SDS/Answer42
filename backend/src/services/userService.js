/**
 * Servicio de Usuario
 * Operaciones de consulta de perfil e historial
 */

import { getDb } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Obtiene el perfil completo del usuario para el dashboard
 */
export async function getUserProfile(userId) {
  const db = getDb();

  const user = db.prepare(`
    SELECT
      id,
      username,
      email,
      password_hash,
      ip_history,
      device_history,
      created_at,
      last_login_at
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Parsear historiales JSON
  const ipHistory = JSON.parse(user.ip_history || '[]');
  const deviceHistory = JSON.parse(user.device_history || '[]');

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    // Hash mostrado para propósitos didácticos
    passwordHash: user.password_hash,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    ipHistory: ipHistory,
    deviceHistory: deviceHistory,
    stats: {
      totalIps: ipHistory.length,
      totalDevices: deviceHistory.length,
      accountAge: calculateAccountAge(user.created_at)
    }
  };
}

/**
 * Obtiene solo el historial de IPs y dispositivos
 */
export async function getUserHistory(userId) {
  const db = getDb();

  const user = db.prepare(`
    SELECT ip_history, device_history
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  return {
    ipHistory: JSON.parse(user.ip_history || '[]'),
    deviceHistory: JSON.parse(user.device_history || '[]')
  };
}

/**
 * Calcula la antigüedad de la cuenta
 */
function calculateAccountAge(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return '1 día';
  if (diffDays < 30) return `${diffDays} días`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`;
  return `${Math.floor(diffDays / 365)} años`;
}
