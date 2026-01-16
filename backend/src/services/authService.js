/**
 * Servicio de Autenticación
 * Maneja registro, login y verificación de credenciales
 */

import argon2 from 'argon2';
import { getDb } from '../config/database.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import * as auditService from './auditService.js';

// Configuración Argon2id (OWASP recomendado)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,          // 3 iteraciones
  parallelism: 4        // 4 hilos
};

const MAX_HISTORY_SIZE = 20;

/**
 * Registra un nuevo usuario
 */
export async function registerUser({ username, email, password, ip, userAgent, deviceHash }) {
  const db = getDb();

  // Verificar si el usuario ya existe
  const existingUser = db.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).get(username, email);

  if (existingUser) {
    // Mensaje genérico para no revelar si es el username o email
    throw new ValidationError('El usuario o email ya está registrado');
  }

  // Hash de la contraseña con Argon2id
  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

  // Preparar historial inicial
  const ipHistory = JSON.stringify([{ ip, timestamp: new Date().toISOString() }]);
  const deviceHistory = JSON.stringify([{ hash: deviceHash, userAgent, timestamp: new Date().toISOString() }]);

  // Insertar usuario
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, ip_history, device_history)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(username, email, passwordHash, ipHistory, deviceHistory);

  // Log de auditoría
  await auditService.logAction({
    userId: result.lastInsertRowid,
    action: 'REGISTER',
    ip,
    deviceHash,
    userAgent,
    success: true
  });

  logger.info(`Nuevo usuario registrado: ${username} (ID: ${result.lastInsertRowid})`);

  return {
    id: result.lastInsertRowid,
    username
  };
}

/**
 * Inicia sesión de usuario
 * Retorna datos del usuario y alertas de IP/dispositivo nuevo
 */
export async function loginUser({ username, password, ip, userAgent, deviceHash }) {
  const db = getDb();

  // Buscar usuario
  const user = db.prepare(
    'SELECT * FROM users WHERE username = ?'
  ).get(username);

  // Verificar si el usuario existe y no está bloqueado
  if (!user) {
    // Log de intento fallido (usuario no existe)
    await auditService.logAction({
      userId: null,
      action: 'LOGIN_FAILED',
      ip,
      deviceHash,
      userAgent,
      details: { reason: 'USER_NOT_FOUND', attemptedUsername: username },
      success: false
    });

    // Mensaje genérico (no revelar que el usuario no existe)
    throw new AuthenticationError('Credenciales inválidas');
  }

  // Verificar si está bloqueado
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new AuthenticationError('Cuenta temporalmente bloqueada. Intenta más tarde.');
  }

  // Verificar contraseña
  const validPassword = await argon2.verify(user.password_hash, password);

  if (!validPassword) {
    // Incrementar intentos fallidos
    const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
    let lockUntil = null;

    // Bloquear después de 5 intentos
    if (newFailedAttempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos
      logger.warn(`Usuario bloqueado por múltiples intentos fallidos: ${username}`);
    }

    db.prepare(`
      UPDATE users
      SET failed_login_attempts = ?, locked_until = ?
      WHERE id = ?
    `).run(newFailedAttempts, lockUntil, user.id);

    await auditService.logAction({
      userId: user.id,
      action: 'LOGIN_FAILED',
      ip,
      deviceHash,
      userAgent,
      details: { reason: 'INVALID_PASSWORD', attempts: newFailedAttempts },
      success: false
    });

    throw new AuthenticationError('Credenciales inválidas');
  }

  // Login exitoso - resetear intentos fallidos
  db.prepare(`
    UPDATE users
    SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(user.id);

  // Verificar IP y dispositivo nuevos
  const alerts = checkNewIpAndDevice(user, ip, deviceHash, userAgent);

  // Actualizar historial
  updateHistory(user.id, ip, deviceHash, userAgent);

  // Log de auditoría
  await auditService.logAction({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    ip,
    deviceHash,
    userAgent,
    details: { alerts },
    success: true
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.password_hash, // Solo para demo didáctica
      lastLogin: user.last_login_at
    },
    alerts
  };
}

/**
 * Verifica si la IP o dispositivo son nuevos
 */
function checkNewIpAndDevice(user, currentIp, currentDeviceHash, userAgent) {
  const alerts = [];

  // Parsear historiales
  const ipHistory = JSON.parse(user.ip_history || '[]');
  const deviceHistory = JSON.parse(user.device_history || '[]');

  // Verificar IP nueva
  const knownIps = ipHistory.map(entry => entry.ip);
  const isNewIp = !knownIps.includes(currentIp);

  if (isNewIp) {
    alerts.push({
      type: 'NEW_IP',
      message: `Nueva IP detectada: ${currentIp}`,
      severity: 'warning'
    });
  }

  // Verificar dispositivo nuevo
  const knownDevices = deviceHistory.map(entry => entry.hash);
  const isNewDevice = !knownDevices.includes(currentDeviceHash);

  if (isNewDevice) {
    alerts.push({
      type: 'NEW_DEVICE',
      message: 'Nuevo dispositivo detectado',
      severity: 'warning',
      details: { userAgent }
    });
  }

  // Alerta combinada
  if (isNewIp && isNewDevice) {
    alerts.push({
      type: 'NEW_IP_AND_DEVICE',
      message: 'Primera conexión desde esta IP Y dispositivo',
      severity: 'high'
    });
  }

  return alerts;
}

/**
 * Actualiza los historiales de IP y dispositivo (máximo 20 entradas)
 */
function updateHistory(userId, ip, deviceHash, userAgent) {
  const db = getDb();
  const user = db.prepare('SELECT ip_history, device_history FROM users WHERE id = ?').get(userId);

  // Actualizar IP history
  let ipHistory = JSON.parse(user.ip_history || '[]');
  const existingIpIndex = ipHistory.findIndex(entry => entry.ip === ip);

  if (existingIpIndex >= 0) {
    // Actualizar timestamp de IP existente
    ipHistory[existingIpIndex].timestamp = new Date().toISOString();
    ipHistory[existingIpIndex].count = (ipHistory[existingIpIndex].count || 1) + 1;
  } else {
    // Añadir nueva IP
    ipHistory.unshift({ ip, timestamp: new Date().toISOString(), count: 1 });
    if (ipHistory.length > MAX_HISTORY_SIZE) {
      ipHistory = ipHistory.slice(0, MAX_HISTORY_SIZE);
    }
  }

  // Actualizar device history
  let deviceHistory = JSON.parse(user.device_history || '[]');
  const existingDeviceIndex = deviceHistory.findIndex(entry => entry.hash === deviceHash);

  if (existingDeviceIndex >= 0) {
    // Actualizar timestamp de dispositivo existente
    deviceHistory[existingDeviceIndex].timestamp = new Date().toISOString();
    deviceHistory[existingDeviceIndex].count = (deviceHistory[existingDeviceIndex].count || 1) + 1;
  } else {
    // Añadir nuevo dispositivo
    deviceHistory.unshift({
      hash: deviceHash,
      userAgent,
      timestamp: new Date().toISOString(),
      count: 1
    });
    if (deviceHistory.length > MAX_HISTORY_SIZE) {
      deviceHistory = deviceHistory.slice(0, MAX_HISTORY_SIZE);
    }
  }

  // Guardar cambios
  db.prepare(`
    UPDATE users
    SET ip_history = ?, device_history = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(ipHistory), JSON.stringify(deviceHistory), userId);
}
