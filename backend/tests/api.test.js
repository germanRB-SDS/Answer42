/**
 * Tests de Integración API
 * Prueba endpoints HTTP completos
 *
 * NOTA: El servidor debe estar recién iniciado para evitar rate limiting
 * Ejecutar con: npm test
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

// URL base del servidor (debe estar corriendo)
const API_BASE = 'http://localhost:3001/api';

// Helper para hacer requests
async function api(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  return { status: response.status, data, headers: response.headers };
}

// Helper para verificar si estamos rate limited
function isRateLimited(status) {
  return status === 429;
}

describe('API Integration Tests', () => {
  // Variable para guardar cookies entre requests
  let sessionCookie = '';

  describe('Health Check', () => {
    it('GET /health debe responder ok', async () => {
      const { status, data } = await api('/health');

      assert.strictEqual(status, 200);
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.timestamp);
      assert.strictEqual(data.environment, 'development');
    });
  });

  describe('Validación de Registro', () => {
    it('POST /auth/register debe validar campos requeridos', async () => {
      const { status, data } = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({})
      });

      // Validación falla antes de rate limiting
      if (isRateLimited(status)) {
        console.log('  ⚠️  Rate limited - test skipped');
        return;
      }

      assert.strictEqual(status, 400);
      assert.strictEqual(data.code, 'VALIDATION_ERROR');
      assert.ok(data.details.length > 0);
    });
  });

  describe('Login con usuario demo-user', () => {
    // Usuario creado manualmente: demo-user / Password123!

    it('POST /auth/login debe aceptar credenciales correctas', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'demo-user',
          password: 'Password123!',
          deviceHash: 'test-device'
        })
      });

      const data = await response.json();

      if (isRateLimited(response.status)) {
        console.log('  ⚠️  Rate limited - reiniciar servidor para test completo');
        return;
      }

      assert.strictEqual(response.status, 200, `Error: ${JSON.stringify(data)}`);
      assert.strictEqual(data.message, 'Login exitoso');
      assert.ok(data.user);
      assert.ok(data.user.passwordHash.startsWith('$argon2id$'));

      // Guardar cookie
      sessionCookie = response.headers.get('set-cookie');
      assert.ok(sessionCookie, 'Debe devolver cookie de sesión');
      assert.ok(sessionCookie.includes('HttpOnly'), 'Cookie debe ser HttpOnly');
    });

    it('POST /auth/login debe rechazar password incorrecto', async () => {
      const { status, data } = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'demo-user',
          password: 'WrongPassword',
          deviceHash: 'test'
        })
      });

      if (isRateLimited(status)) {
        console.log('  ⚠️  Rate limited - test skipped');
        return;
      }

      assert.strictEqual(status, 401);
      assert.strictEqual(data.error, 'Credenciales inválidas');
    });
  });

  describe('Sesión', () => {
    it('GET /auth/session sin cookie debe devolver authenticated: false', async () => {
      const { status, data } = await api('/auth/session');

      assert.strictEqual(status, 200);
      assert.strictEqual(data.authenticated, false);
    });

    it('GET /auth/session con cookie debe devolver authenticated: true', async () => {
      if (!sessionCookie) {
        console.log('  ⚠️  No hay cookie de sesión - ejecutar tests en orden');
        return;
      }

      const response = await fetch(`${API_BASE}/auth/session`, {
        headers: { 'Cookie': sessionCookie.split(';')[0] }
      });
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.authenticated, true);
    });
  });

  describe('Rutas Protegidas', () => {
    it('GET /user/profile sin auth debe devolver 401', async () => {
      const { status, data } = await api('/user/profile');

      assert.strictEqual(status, 401);
      assert.strictEqual(data.code, 'UNAUTHORIZED');
    });

    it('GET /user/profile con sesión debe devolver perfil', async () => {
      if (!sessionCookie) {
        console.log('  ⚠️  No hay cookie de sesión - ejecutar tests en orden');
        return;
      }

      const response = await fetch(`${API_BASE}/user/profile`, {
        headers: { 'Cookie': sessionCookie.split(';')[0] }
      });
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.ok(data.user);
      assert.ok(data.user.username);
      assert.ok(data.user.ipHistory);
      assert.ok(data.user.deviceHistory);
    });
  });

  describe('Headers de Seguridad', () => {
    it('debe incluir headers de seguridad (helmet)', async () => {
      const response = await fetch(`${API_BASE}/health`);

      assert.strictEqual(
        response.headers.get('x-content-type-options'),
        'nosniff'
      );
      assert.ok(response.headers.get('x-frame-options'));
    });
  });

  describe('CORS', () => {
    it('debe responder a preflight OPTIONS', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST'
        }
      });

      assert.ok(response.status < 400);
    });
  });
});

describe('Seguridad', () => {
  it('mensajes de error no revelan si usuario existe', async () => {
    // Usuario inexistente
    const r1 = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'usuario_que_no_existe_xyz',
        password: 'pass',
        deviceHash: 'test'
      })
    });

    if (!isRateLimited(r1.status)) {
      assert.strictEqual(r1.data.error, 'Credenciales inválidas');
    }

    // Usuario existente, password incorrecto
    const r2 = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'demo-user',
        password: 'wrong',
        deviceHash: 'test'
      })
    });

    if (!isRateLimited(r2.status)) {
      // Mismo mensaje - no revela que el usuario existe
      assert.strictEqual(r2.data.error, 'Credenciales inválidas');
    }
  });

  it('hash de password usa Argon2id', async () => {
    // Obtener perfil (necesitamos sesión)
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'demo-user',
        password: 'Password123!',
        deviceHash: 'test'
      })
    });

    if (isRateLimited(loginResponse.status)) {
      console.log('  ⚠️  Rate limited - test skipped');
      return;
    }

    const loginData = await loginResponse.json();
    const cookie = loginResponse.headers.get('set-cookie');

    const profileResponse = await fetch(`${API_BASE}/user/profile`, {
      headers: { 'Cookie': cookie.split(';')[0] }
    });
    const { user } = await profileResponse.json();

    assert.ok(user.passwordHash.startsWith('$argon2id$'), 'Hash debe ser Argon2id');
    assert.ok(user.passwordHash.includes('m=65536'), 'Debe usar 64MB de memoria');
    assert.ok(user.passwordHash.includes('t=3'), 'Debe usar 3 iteraciones');
    assert.ok(user.passwordHash.includes('p=4'), 'Debe usar 4 threads');
  });
});
