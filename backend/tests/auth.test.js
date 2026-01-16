/**
 * Tests de Autenticación
 * Ejecutar con: npm test
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import path from 'path';

// Configurar entorno de test
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:'; // Base de datos en memoria para tests

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Importar después de configurar entorno
const { initializeDatabase, getDb, closeDb } = await import('../src/config/database.js');
const authService = await import('../src/services/authService.js');

describe('AuthService', () => {
  before(() => {
    // Inicializar BD en memoria
    initializeDatabase();
  });

  after(() => {
    closeDb();
  });

  describe('registerUser', () => {
    it('debe registrar un usuario correctamente', async () => {
      const result = await authService.registerUser({
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'TestPass123',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        deviceHash: 'test-device-1'
      });

      assert.ok(result.id, 'Debe devolver un ID');
      assert.strictEqual(result.username, 'testuser1');
    });

    it('debe rechazar username duplicado', async () => {
      // Primero registrar
      await authService.registerUser({
        username: 'duplicateuser',
        email: 'dup1@example.com',
        password: 'TestPass123',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        deviceHash: 'test-device-2'
      });

      // Intentar duplicar
      await assert.rejects(
        authService.registerUser({
          username: 'duplicateuser',
          email: 'dup2@example.com',
          password: 'TestPass123',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          deviceHash: 'test-device-3'
        }),
        /ya está registrado/
      );
    });

    it('debe rechazar email duplicado', async () => {
      await authService.registerUser({
        username: 'emailuser1',
        email: 'same@example.com',
        password: 'TestPass123',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        deviceHash: 'test-device-4'
      });

      await assert.rejects(
        authService.registerUser({
          username: 'emailuser2',
          email: 'same@example.com',
          password: 'TestPass123',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          deviceHash: 'test-device-5'
        }),
        /ya está registrado/
      );
    });

    it('debe hashear la contraseña con Argon2id', async () => {
      const result = await authService.registerUser({
        username: 'hashtest',
        email: 'hash@example.com',
        password: 'MyPassword123',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        deviceHash: 'test-device-6'
      });

      const db = getDb();
      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(result.id);

      assert.ok(user.password_hash.startsWith('$argon2id$'), 'Hash debe ser Argon2id');
      assert.notStrictEqual(user.password_hash, 'MyPassword123', 'No debe guardar password en texto plano');
    });
  });

  describe('loginUser', () => {
    before(async () => {
      // Crear usuario para tests de login
      await authService.registerUser({
        username: 'logintest',
        email: 'login@example.com',
        password: 'LoginPass123',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        deviceHash: 'login-device-1'
      });
    });

    it('debe hacer login con credenciales correctas', async () => {
      const result = await authService.loginUser({
        username: 'logintest',
        password: 'LoginPass123',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        deviceHash: 'login-device-1'
      });

      assert.ok(result.user, 'Debe devolver usuario');
      assert.strictEqual(result.user.username, 'logintest');
      assert.ok(result.user.passwordHash, 'Debe incluir hash (demo)');
      assert.ok(Array.isArray(result.alerts), 'Debe incluir array de alertas');
    });

    it('debe rechazar password incorrecto', async () => {
      await assert.rejects(
        authService.loginUser({
          username: 'logintest',
          password: 'WrongPassword123',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          deviceHash: 'login-device-1'
        }),
        /Credenciales inválidas/
      );
    });

    it('debe rechazar usuario inexistente', async () => {
      await assert.rejects(
        authService.loginUser({
          username: 'noexiste',
          password: 'SomePass123',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          deviceHash: 'some-device'
        }),
        /Credenciales inválidas/
      );
    });

    it('debe detectar dispositivo nuevo y generar alerta', async () => {
      const result = await authService.loginUser({
        username: 'logintest',
        password: 'LoginPass123',
        ip: '127.0.0.1',
        userAgent: 'new-agent',
        deviceHash: 'new-device-999'
      });

      const newDeviceAlert = result.alerts.find(a => a.type === 'NEW_DEVICE');
      assert.ok(newDeviceAlert, 'Debe generar alerta de nuevo dispositivo');
      assert.strictEqual(newDeviceAlert.severity, 'warning');
    });

    it('debe detectar IP nueva y generar alerta', async () => {
      const result = await authService.loginUser({
        username: 'logintest',
        password: 'LoginPass123',
        ip: '192.168.1.100',
        userAgent: 'test-agent',
        deviceHash: 'login-device-1'
      });

      const newIpAlert = result.alerts.find(a => a.type === 'NEW_IP');
      assert.ok(newIpAlert, 'Debe generar alerta de nueva IP');
    });
  });

  describe('Seguridad de contraseñas', () => {
    it('no debe ser posible verificar password sin el servicio', async () => {
      const db = getDb();
      const user = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('logintest');

      // El hash no debe ser reversible
      assert.ok(user.password_hash.length > 50, 'Hash debe ser largo');
      assert.ok(user.password_hash.includes('$'), 'Hash debe tener formato Argon2');
    });
  });

  describe('Validaciones de seguridad', () => {
    it('mensajes de error no deben revelar si usuario existe', async () => {
      // Usuario inexistente
      try {
        await authService.loginUser({
          username: 'noexiste_security',
          password: 'Pass123',
          ip: '127.0.0.1',
          userAgent: 'test',
          deviceHash: 'test'
        });
        assert.fail('Debería haber lanzado error');
      } catch (e) {
        assert.strictEqual(e.message, 'Credenciales inválidas');
      }

      // Password incorrecto para usuario existente
      try {
        await authService.loginUser({
          username: 'logintest',
          password: 'WrongPass',
          ip: '127.0.0.1',
          userAgent: 'test',
          deviceHash: 'test'
        });
        assert.fail('Debería haber lanzado error');
      } catch (e) {
        // Mismo mensaje que usuario inexistente
        assert.strictEqual(e.message, 'Credenciales inválidas');
      }
    });
  });
});
