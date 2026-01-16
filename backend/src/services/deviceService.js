/**
 * Servicio de Device Fingerprinting
 *
 * ⚠️ NOTA DIDÁCTICA:
 * El fingerprinting web tiene limitaciones severas (ver docs/01-arquitectura).
 * Esta implementación es simplificada para propósitos educativos.
 * En producción, considerar librerías como FingerprintJS.
 */

import crypto from 'crypto';

/**
 * Genera un hash de dispositivo basado en datos del cliente
 * Esta función se usa principalmente para verificar el hash enviado desde el frontend
 *
 * @param {Object} data - Datos del dispositivo
 * @param {string} data.userAgent - User-Agent del navegador
 * @param {string} data.language - Idioma del navegador
 * @param {string} data.screenResolution - Resolución de pantalla
 * @param {string} data.timezone - Zona horaria
 * @returns {string} Hash SHA-256 del dispositivo
 */
export function generateDeviceHash(data) {
  const {
    userAgent = 'unknown',
    language = 'unknown',
    screenResolution = 'unknown',
    timezone = 'unknown'
  } = data;

  const fingerprint = [
    userAgent,
    language,
    screenResolution,
    timezone
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(fingerprint)
    .digest('hex')
    .substring(0, 16); // Truncar para simplificar visualización
}

/**
 * Valida que un deviceHash tenga formato correcto
 * @param {string} hash - Hash a validar
 * @returns {boolean}
 */
export function isValidDeviceHash(hash) {
  if (!hash || typeof hash !== 'string') return false;
  // Debe ser hexadecimal de 16 caracteres
  return /^[a-f0-9]{16}$/i.test(hash);
}

/**
 * Información sobre las limitaciones del fingerprinting
 * (Para mostrar en el dashboard como nota educativa)
 */
export const FINGERPRINT_LIMITATIONS = {
  title: 'Limitaciones del Device Fingerprinting',
  points: [
    'No es único: Muchos dispositivos tienen fingerprint similar',
    'Cambia con actualizaciones del navegador',
    'Modo incógnito puede normalizar el fingerprint',
    'En localhost, todos los accesos parecen del mismo dispositivo',
    'Puede violar GDPR si se usa sin consentimiento'
  ],
  recommendation: 'Usar como factor adicional, NUNCA como único identificador'
};
