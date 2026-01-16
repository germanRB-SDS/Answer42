# Prompt 3 – Backend Base + Configuración SQLite

**Proyecto:** Answer42 - Sistema de Autenticación Seguro (Taller DAW)
**Fecha:** Enero 2026

---

## Resumen

Este prompt verifica que el backend funciona correctamente con SQLite y todos los endpoints de autenticación operativos.

---

## 1. Instalación de Dependencias

```bash
cd backend
npm install
```

**Resultado:** 255 paquetes instalados, 0 vulnerabilidades.

| Dependencia | Propósito | Estado |
|-------------|-----------|--------|
| express | Framework HTTP | ✅ |
| better-sqlite3 | Base de datos | ✅ |
| argon2 | Hashing passwords | ✅ |
| express-session | Sesiones | ✅ |
| connect-sqlite3 | Store sesiones | ✅ |
| express-rate-limit | Rate limiting | ✅ |
| helmet | Headers seguridad | ✅ |
| cors | Control de origen | ✅ |
| express-validator | Validación | ✅ |
| winston | Logging | ✅ |

---

## 2. Inicialización de Base de Datos

### Script creado: `src/config/initDb.js`

```bash
npm run db:init
```

### Tablas creadas:

#### Tabla `users`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Identificador único |
| username | TEXT UNIQUE | Nombre de usuario (case insensitive) |
| email | TEXT UNIQUE | Email de recuperación |
| password_hash | TEXT | Hash Argon2id |
| ip_history | TEXT (JSON) | Array de IPs (máx 20) |
| device_history | TEXT (JSON) | Array de dispositivos (máx 20) |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Última actualización |
| last_login_at | DATETIME | Último login exitoso |
| failed_login_attempts | INTEGER | Intentos fallidos |
| locked_until | DATETIME | Bloqueo temporal |

#### Tabla `audit_log`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Identificador único |
| user_id | INTEGER FK | Usuario (nullable) |
| action | TEXT | Tipo de acción |
| ip_address | TEXT | IP del cliente |
| device_hash | TEXT | Hash del dispositivo |
| user_agent | TEXT | Navegador/cliente |
| details | TEXT (JSON) | Detalles adicionales |
| success | INTEGER | 1=éxito, 0=fallo |
| created_at | DATETIME | Timestamp |

### Índices creados:
- `idx_users_username` - Búsqueda por username
- `idx_users_email` - Búsqueda por email
- `idx_audit_user` - Filtrar por usuario
- `idx_audit_action` - Filtrar por acción
- `idx_audit_created` - Ordenar por fecha

---

## 3. Pruebas de Endpoints

### 3.1 Health Check
```bash
GET /api/health
```
**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-16T16:50:23.305Z",
  "environment": "development"
}
```

### 3.2 Verificar Sesión (sin login)
```bash
GET /api/auth/session
```
**Respuesta:**
```json
{
  "authenticated": false
}
```

### 3.3 Registro con Validación Fallida
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "ab",
  "email": "invalid",
  "password": "123",
  "confirmPassword": "123"
}
```
**Respuesta (400):**
```json
{
  "error": "Datos de entrada inválidos",
  "code": "VALIDATION_ERROR",
  "details": [
    {"field": "username", "message": "Usuario debe tener entre 3 y 30 caracteres"},
    {"field": "email", "message": "Email inválido"},
    {"field": "password", "message": "Contraseña debe tener al menos 8 caracteres"},
    {"field": "password", "message": "Contraseña debe incluir mayúscula, minúscula y número"}
  ]
}
```

> [Nota profesor: La validación funciona correctamente, devolviendo todos los errores de una vez para mejor UX.]

### 3.4 Registro Exitoso
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPass123",
  "confirmPassword": "TestPass123",
  "deviceHash": "abc123def45678"
}
```
**Respuesta (201):**
```json
{
  "message": "Usuario registrado correctamente",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

### 3.5 Login con Password Incorrecto
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "WrongPass123",
  "deviceHash": "abc123def45678"
}
```
**Respuesta (401):**
```json
{
  "error": "Credenciales inválidas",
  "code": "AUTHENTICATION_ERROR"
}
```

> [Nota profesor: El mensaje es genérico a propósito. No revela si el usuario existe o si es la contraseña la que falla. Esto previene enumeración de usuarios (OWASP A07).]

### 3.6 Login Exitoso
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "TestPass123",
  "deviceHash": "abc123def45678"
}
```
**Respuesta (200):**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "passwordHash": "$argon2id$v=19$m=65536,t=3,p=4$...",
    "lastLogin": null
  },
  "alerts": []
}
```

**Headers de respuesta:**
```
Set-Cookie: sid=...; Path=/; HttpOnly; SameSite=Strict
```

### 3.7 Login desde Nuevo Dispositivo (Alerta)
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "TestPass123",
  "deviceHash": "newdevice12345"
}
```
**Respuesta (200):**
```json
{
  "message": "Login exitoso",
  "user": { ... },
  "alerts": [
    {
      "type": "NEW_DEVICE",
      "message": "Nuevo dispositivo detectado",
      "severity": "warning",
      "details": {
        "userAgent": "curl/8.7.1"
      }
    }
  ]
}
```

> [Nota profesor: El sistema detecta que el deviceHash no estaba en el historial y genera una alerta. Esto es lo que se mostrará en el Dashboard.]

### 3.8 Obtener Perfil (Autenticado)
```bash
GET /api/user/profile
Cookie: sid=...
```
**Respuesta (200):**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "passwordHash": "$argon2id$v=19$m=65536,t=3,p=4$...",
    "createdAt": "2026-01-16 16:50:54",
    "lastLoginAt": "2026-01-16 16:51:06",
    "ipHistory": [
      {
        "ip": "::1",
        "timestamp": "2026-01-16T16:51:06.924Z",
        "count": 2
      }
    ],
    "deviceHistory": [
      {
        "hash": "abc123def45678",
        "userAgent": "curl/8.7.1",
        "timestamp": "2026-01-16T16:51:06.924Z",
        "count": 2
      }
    ],
    "stats": {
      "totalIps": 1,
      "totalDevices": 1,
      "accountAge": "Hoy"
    }
  }
}
```

---

## 4. Verificación de Audit Log

El sistema registra automáticamente todas las acciones relevantes:

```
[OK]   LOGIN_SUCCESS - IP: ::1 - Device: newdevice12345
[OK]   LOGIN_SUCCESS - IP: ::1 - Device: abc123def45678
[FAIL] LOGIN_FAILED  - IP: ::1 - Device: abc123def45678
[OK]   REGISTER      - IP: ::1 - Device: abc123def45678
```

---

## 5. Verificación de Seguridad

| Característica | Estado | Verificación |
|----------------|--------|--------------|
| Hash Argon2id | ✅ | Password hash comienza con `$argon2id$` |
| Parámetros correctos | ✅ | `m=65536,t=3,p=4` (64MB, 3 iter, 4 threads) |
| Cookie httpOnly | ✅ | No accesible desde JS |
| Cookie SameSite | ✅ | `SameSite=Strict` en header |
| Mensajes genéricos | ✅ | "Credenciales inválidas" sin revelar detalles |
| Validación completa | ✅ | Todos los errores devueltos |
| Audit logging | ✅ | Todas las acciones registradas |
| Detección dispositivo | ✅ | Alerta generada para device nuevo |

---

## 6. Archivos Creados/Modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/config/initDb.js` | Creado | Script de inicialización BD |
| `data/answer42.db` | Generado | Base de datos SQLite |
| `data/sessions.db` | Generado | Store de sesiones |
| `logs/combined.log` | Generado | Log combinado |
| `logs/error.log` | Generado | Log de errores |

---

## 7. Comandos Útiles

```bash
# Inicializar/reiniciar base de datos
npm run db:init

# Iniciar servidor en desarrollo
npm run dev

# Ver logs en tiempo real
tail -f logs/combined.log

# Consultar base de datos directamente
sqlite3 data/answer42.db "SELECT * FROM users;"
sqlite3 data/answer42.db "SELECT * FROM audit_log;"
```

---

## 8. Próximos Pasos

```
[✅] Prompt 1: Arquitectura y decisiones
[✅] Prompt 2: Setup del proyecto
[✅] Prompt 3: Backend base + SQLite (ACTUAL)
[ ] Prompt 4: Sistema de registro (ya implementado, revisar)
[ ] Prompt 5: Sistema de login + sesiones (ya implementado, revisar)
[ ] Prompt 6: Seguridad avanzada (rate limiting, CSRF)
[ ] Prompt 7: Frontend login/registro
[ ] Prompt 8: Dashboard post-login + alertas
[ ] Prompt 9: Tests mínimos
[ ] Prompt 10: Revisión OWASP
[ ] Prompt 11: Documentación final
```

> [Nota profesor: El backend está completamente funcional. Los Prompts 4 y 5 ya están implementados en el código del Prompt 2. Podemos pasar directamente al Prompt 6 (seguridad avanzada) o al Prompt 7 (frontend).]

---

## 9. Resumen de Pruebas

| Endpoint | Método | Resultado |
|----------|--------|-----------|
| /api/health | GET | ✅ OK |
| /api/auth/session | GET | ✅ authenticated: false/true |
| /api/auth/register | POST | ✅ Validación + Registro |
| /api/auth/login | POST | ✅ Auth + Sesión + Alertas |
| /api/user/profile | GET | ✅ Perfil completo |

**Tiempo total de pruebas:** ~3 segundos

---

**Fin del Prompt 3**

*El backend está completamente operativo y probado.*
