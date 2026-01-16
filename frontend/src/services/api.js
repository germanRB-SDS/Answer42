/**
 * Servicio API
 * Comunicación con el backend
 */

const API_BASE = '/api';

/**
 * Genera un hash del dispositivo para fingerprinting
 * NOTA: Implementación simplificada para propósitos didácticos
 */
export function generateDeviceHash() {
  const data = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('|');

  // Hash simple con Web Crypto API
  return crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(data))
    .then(buffer => {
      const hashArray = Array.from(new Uint8Array(buffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.substring(0, 16); // Truncar a 16 caracteres
    });
}

/**
 * Wrapper para fetch con manejo de errores
 */
async function fetchApi(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Enviar cookies
    ...options
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Error en la petición');
    error.code = data.code;
    error.details = data.details;
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * Verifica si hay sesión activa
 */
export async function checkSession() {
  return fetchApi('/auth/session');
}

/**
 * Inicia sesión
 */
export async function login(username, password, deviceHash) {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, deviceHash })
  });
}

/**
 * Registra un nuevo usuario
 */
export async function register({ username, email, password, confirmPassword, deviceHash }) {
  return fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, confirmPassword, deviceHash })
  });
}

/**
 * Cierra sesión
 */
export async function logout() {
  return fetchApi('/auth/logout', {
    method: 'POST'
  });
}

/**
 * Obtiene el perfil del usuario
 */
export async function getProfile() {
  return fetchApi('/user/profile');
}

/**
 * Obtiene el historial de IPs y dispositivos
 */
export async function getHistory() {
  return fetchApi('/user/history');
}
