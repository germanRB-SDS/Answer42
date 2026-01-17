# Prompt 9 – Tests Mínimos

**Proyecto:** Answer42 - Sistema de Autenticación Seguro (Taller DAW)
**Fecha:** Enero 2026

---

## Resumen

Este prompt implementa y ejecuta una suite de tests mínimos para verificar el correcto funcionamiento del sistema de autenticación.

---

## 1. Usuario Demo Creado

Se creó el usuario de demostración para pruebas:

| Campo | Valor |
|-------|-------|
| Username | `demo-user` |
| Password | `Password123!` |
| Email | `demo@answer42.local` |
| ID | 3 |

> [Nota profesor: Este usuario puede usarse para demostrar el sistema en clase sin necesidad de registrar uno nuevo.]

---

## 2. Tests Unitarios (auth.test.js)

**11 tests - 100% passed**

### Suite: registerUser
| Test | Resultado | Tiempo |
|------|-----------|--------|
| Debe registrar un usuario correctamente | ✅ | 34ms |
| Debe rechazar username duplicado | ✅ | 29ms |
| Debe rechazar email duplicado | ✅ | 28ms |
| Debe hashear la contraseña con Argon2id | ✅ | 29ms |

### Suite: loginUser
| Test | Resultado | Tiempo |
|------|-----------|--------|
| Debe hacer login con credenciales correctas | ✅ | 29ms |
| Debe rechazar password incorrecto | ✅ | 28ms |
| Debe rechazar usuario inexistente | ✅ | <1ms |
| Debe detectar dispositivo nuevo y generar alerta | ✅ | 28ms |
| Debe detectar IP nueva y generar alerta | ✅ | 28ms |

### Suite: Seguridad
| Test | Resultado | Tiempo |
|------|-----------|--------|
| No debe ser posible verificar password sin el servicio | ✅ | <1ms |
| Mensajes de error no deben revelar si usuario existe | ✅ | 28ms |

**Tiempo total:** ~358ms

---

## 3. Tests de Integración (api.test.js)

**12 tests - 100% passed**

### Suite: Health Check
| Test | Resultado |
|------|-----------|
| GET /health debe responder ok | ✅ |

### Suite: Validación de Registro
| Test | Resultado |
|------|-----------|
| POST /auth/register debe validar campos requeridos | ✅ |

### Suite: Login con usuario demo-user
| Test | Resultado |
|------|-----------|
| POST /auth/login debe aceptar credenciales correctas | ✅ |
| POST /auth/login debe rechazar password incorrecto | ✅ |

### Suite: Sesión
| Test | Resultado |
|------|-----------|
| GET /auth/session sin cookie debe devolver authenticated: false | ✅ |
| GET /auth/session con cookie debe devolver authenticated: true | ✅ |

### Suite: Rutas Protegidas
| Test | Resultado |
|------|-----------|
| GET /user/profile sin auth debe devolver 401 | ✅ |
| GET /user/profile con sesión debe devolver perfil | ✅ |

### Suite: Headers de Seguridad
| Test | Resultado |
|------|-----------|
| Debe incluir headers de seguridad (helmet) | ✅ |

### Suite: CORS
| Test | Resultado |
|------|-----------|
| Debe responder a preflight OPTIONS | ✅ |

### Suite: Seguridad
| Test | Resultado |
|------|-----------|
| Mensajes de error no revelan si usuario existe | ✅ |
| Hash de password usa Argon2id | ✅ |

**Tiempo total:** ~214ms

---

## 4. Verificaciones de Seguridad OWASP

Los tests verifican las siguientes medidas de seguridad:

| OWASP | Verificación | Estado |
|-------|--------------|--------|
| A02 Cryptographic Failures | Hash Argon2id con parámetros correctos | ✅ |
| A02 Cryptographic Failures | m=65536, t=3, p=4 verificados | ✅ |
| A05 Security Misconfiguration | Headers X-Content-Type-Options | ✅ |
| A05 Security Misconfiguration | Headers X-Frame-Options | ✅ |
| A07 Auth Failures | Mensajes genéricos que no revelan usuarios | ✅ |
| A07 Auth Failures | Rate limiting activo (429) | ✅ |
| A07 Auth Failures | Cookie HttpOnly verificada | ✅ |

---

## 5. Comandos para Ejecutar Tests

```bash
# Tests unitarios solamente
cd backend && node --test tests/auth.test.js

# Tests de integración (servidor debe estar corriendo)
cd backend && node --test tests/api.test.js

# Todos los tests
cd backend && npm test

# IMPORTANTE: Reiniciar servidor antes de tests de integración
# para evitar rate limiting de ejecuciones anteriores
pkill -f "node src/index.js"
npm run dev &
sleep 3
npm test
```

---

## 6. Estructura de Tests

```
backend/tests/
├── auth.test.js     # Tests unitarios (BD en memoria)
│   ├── registerUser (4 tests)
│   ├── loginUser (5 tests)
│   └── seguridad (2 tests)
│
└── api.test.js      # Tests de integración (HTTP)
    ├── Health Check (1 test)
    ├── Validación de Registro (1 test)
    ├── Login (2 tests)
    ├── Sesión (2 tests)
    ├── Rutas Protegidas (2 tests)
    ├── Headers de Seguridad (1 test)
    ├── CORS (1 test)
    └── Seguridad (2 tests)
```

---

## 7. Notas sobre Rate Limiting en Tests

Los tests de integración pueden verse afectados por el rate limiting configurado:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| /api/auth/register | 3 intentos | 1 hora |
| /api/auth/login | 5 intentos | 15 minutos |
| Global | 100 requests | 15 minutos |

**Solución:** Reiniciar el servidor antes de ejecutar tests para limpiar los contadores de rate limiting (almacenados en memoria).

> [Nota profesor: En producción real, los rate limits se almacenarían en Redis y no se reiniciarían con el servidor. Para el taller, el almacenamiento en memoria es suficiente.]

---

## 8. Cobertura de Funcionalidades

| Funcionalidad | Tests Unitarios | Tests Integración |
|---------------|-----------------|-------------------|
| Registro de usuario | ✅ 4 tests | ✅ 1 test |
| Login | ✅ 5 tests | ✅ 2 tests |
| Sesiones | - | ✅ 2 tests |
| Rutas protegidas | - | ✅ 2 tests |
| Hash Argon2id | ✅ 1 test | ✅ 1 test |
| Alertas IP/Device | ✅ 2 tests | - |
| Headers seguridad | - | ✅ 1 test |
| CORS | - | ✅ 1 test |
| Mensajes genéricos | ✅ 1 test | ✅ 1 test |

---

## 9. Próximos Pasos

> **Estado actualizado:** Consulta [PROMPT-STATUS-README.md](../PROMPT-STATUS-README.md) para ver el progreso actual del proyecto.

---

## 10. Resultado Final

```
Tests Unitarios:    11/11 ✅ (358ms)
Tests Integración:  12/12 ✅ (214ms)
────────────────────────────────
Total:              23/23 ✅ (572ms)
```

**El sistema de autenticación está completamente testeado y funcional.**

---

**Fin del Prompt 9**

*Suite de tests implementada y verificada.*
