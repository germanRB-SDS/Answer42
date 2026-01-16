# Prompt 7 – Frontend Login/Registro

**Proyecto:** Answer42 - Sistema de Autenticación Seguro (Taller DAW)
**Fecha:** Enero 2026

---

## Resumen

Este prompt verifica e integra el frontend React con el backend, completando el flujo de autenticación end-to-end.

---

## 1. Instalación del Frontend

```bash
cd frontend
npm install
```

**Resultado:** 70 paquetes instalados.

### Vulnerabilidades Detectadas

| Severidad | Paquete | Descripción | Impacto |
|-----------|---------|-------------|---------|
| Moderate | esbuild ≤0.24.2 | Requests no autorizados al dev server | Solo desarrollo |
| Moderate | vite 0.11.0-6.1.6 | Depende de esbuild vulnerable | Solo desarrollo |

> [Nota profesor: Estas vulnerabilidades SOLO afectan al servidor de desarrollo local. El build de producción no está afectado. Para un taller es aceptable.]

---

## 2. Build de Producción

```bash
npm run build
```

**Resultado:**
```
✓ 39 modules transformed
✓ built in 324ms

dist/index.html                   0.79 kB │ gzip:  0.44 kB
dist/assets/index-CEgAfMnw.css    5.83 kB │ gzip:  1.72 kB
dist/assets/index-El1B7tuI.js   178.53 kB │ gzip: 57.30 kB
```

Total: **~60 KB** gzipped (React + Router + App)

---

## 3. Componentes Implementados

### 3.1 LoginForm.jsx

**Características:**
- Campos: username, password
- Validación en cliente antes de enviar
- Generación automática de deviceHash
- Manejo de errores (rate limit, credenciales)
- Redirección automática al dashboard
- Nota didáctica sobre seguridad

**Flujo:**
```
Usuario → Escribe credenciales → Submit
       → Genera deviceHash (SHA-256)
       → POST /api/auth/login
       → Recibe sesión (cookie httpOnly)
       → Redirige a /dashboard
```

### 3.2 RegisterForm.jsx

**Características:**
- Campos: username, email, password, confirmPassword
- Validación doble (cliente + servidor)
- Requisitos de contraseña visibles
- Mensaje de éxito antes de redirigir
- Lista de seguridades implementadas

**Validaciones cliente:**
| Campo | Regla |
|-------|-------|
| username | 3+ chars, alfanumérico + `_` |
| email | Formato válido |
| password | 8+ chars, mayúscula, minúscula, número |
| confirmPassword | Debe coincidir |

### 3.3 Dashboard.jsx

**Secciones:**
1. **Header** - Título + botón logout
2. **Alertas de Seguridad** - IP/dispositivo nuevo
3. **Información de Usuario** - username, email, fechas
4. **Hash de Contraseña** - Demo didáctica con nota
5. **Historial de IPs** - Tabla con contador
6. **Historial de Dispositivos** - Tabla con User-Agent
7. **Estadísticas** - IPs únicas, dispositivos, antigüedad

**Notas didácticas incluidas:**
- Limitaciones de IP como identificador
- Limitaciones del device fingerprinting
- Por qué mostramos el hash (solo demo)

---

## 4. Integración Frontend-Backend

### 4.1 Proxy de Vite

Configurado en `vite.config.js`:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false
    }
  }
}
```

**Resultado:** Las peticiones a `http://localhost:5173/api/*` se redirigen automáticamente a `http://localhost:3001/api/*`.

### 4.2 Pruebas de Integración

```bash
# Via proxy del frontend
curl http://localhost:5173/api/health
# → {"status":"ok","timestamp":"...","environment":"development"}
```

### 4.3 Flujo Completo Probado

| Paso | Endpoint | Resultado |
|------|----------|-----------|
| 1. Session check | GET /api/auth/session | `{"authenticated":false}` |
| 2. Register | POST /api/auth/register | `{"user":{"id":2}}` |
| 3. Login | POST /api/auth/login | Sesión + cookie |
| 4. Profile | GET /api/user/profile | Datos completos |

---

## 5. Hooks y Servicios

### 5.1 useAuth Hook

**Estado global:**
- `user` - Usuario autenticado (o null)
- `loading` - Verificando sesión
- `loginAlerts` - Alertas del último login

**Métodos:**
- `login(username, password, deviceHash)` - Inicia sesión
- `register(userData)` - Crea cuenta
- `logout()` - Cierra sesión
- `clearAlerts()` - Descarta alertas
- `checkSession()` - Verifica sesión activa

### 5.2 API Service

**Funciones:**
```javascript
generateDeviceHash()    // SHA-256 de fingerprint
checkSession()          // GET /api/auth/session
login(u, p, d)         // POST /api/auth/login
register(data)          // POST /api/auth/register
logout()                // POST /api/auth/logout
getProfile()            // GET /api/user/profile
```

### 5.3 Device Fingerprinting

```javascript
const generateDeviceHash = () => {
  const data = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('|');

  return crypto.subtle.digest('SHA-256', ...)
    .then(buffer => hashHex.substring(0, 16));
};
```

> [Nota profesor: Implementación simplificada. Librerías como FingerprintJS son más robustas pero añaden complejidad innecesaria para el taller.]

---

## 6. Routing y Protección de Rutas

### 6.1 Estructura de Rutas

```jsx
<Routes>
  <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
  <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/" element={<Navigate to="/login" />} />
</Routes>
```

### 6.2 Componentes de Protección

**PublicRoute:** Redirige a `/dashboard` si ya hay sesión
**ProtectedRoute:** Redirige a `/login` si no hay sesión

---

## 7. Estilos CSS

### Variables CSS
```css
--color-primary: #2563eb;
--color-error: #ef4444;
--color-warning: #f59e0b;
--color-success: #22c55e;
```

### Clases Principales
| Clase | Uso |
|-------|-----|
| `.auth-container` | Wrapper de login/registro |
| `.auth-card` | Card con formulario |
| `.dashboard-container` | Layout del dashboard |
| `.alert` | Alertas (error, warning, success) |
| `.didactic-note` | Notas educativas azules |
| `.hash-display` | Código con fondo oscuro |
| `.history-table` | Tablas de historial |
| `.stats-grid` | Grid de estadísticas |

---

## 8. Seguridad del Frontend

| Medida | Implementación |
|--------|----------------|
| XSS Prevention | JSX escapa por defecto |
| CSRF | Cookies SameSite=Strict |
| Credentials | `credentials: 'include'` en fetch |
| No secrets | Ningún secreto en código cliente |
| Validación | Doble (cliente + servidor) |
| Error messages | Genéricos del backend |

---

## 9. Comandos de Desarrollo

```bash
# Iniciar frontend (desarrollo)
cd frontend && npm run dev
# → http://localhost:5173

# Iniciar backend (en otra terminal)
cd backend && npm run dev
# → http://localhost:3001

# Build producción
cd frontend && npm run build
# → dist/

# Preview build
cd frontend && npm run preview
```

---

## 10. Screenshots Conceptuales

### Login
```
┌─────────────────────────────────────┐
│         Iniciar Sesión              │
│   Answer42 - Sistema Seguro         │
│                                     │
│   Usuario: [________________]       │
│   Contraseña: [______________]      │
│                                     │
│   [    Iniciar Sesión    ]          │
│                                     │
│   ¿No tienes cuenta? Regístrate     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ Nota: Este formulario       │   │
│   │ implementa rate limiting    │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Dashboard (con alerta)
```
┌─────────────────────────────────────────────────┐
│  Dashboard                    [Cerrar Sesión]   │
├─────────────────────────────────────────────────┤
│  ⚠️ Alertas de Seguridad                        │
│  ┌─────────────────────────────────────────┐    │
│  │ Nuevo Dispositivo detectado             │    │
│  │ User-Agent: Mozilla/5.0...              │    │
│  └─────────────────────────────────────────┘    │
│  [Descartar alertas]                            │
├─────────────────────────────────────────────────┤
│  Información de Usuario                         │
│  Usuario: demouser                              │
│  Email: demo@test.com                           │
│  Cuenta creada: 16 ene 2026                     │
├─────────────────────────────────────────────────┤
│  Hash de Contraseña (Demo)                      │
│  ┌─────────────────────────────────────────┐    │
│  │ $argon2id$v=19$m=65536,t=3,p=4$...      │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  Historial de IPs (1/20)                        │
│  │ IP      │ Última conexión │ Conexiones │     │
│  │ ::1     │ 16 ene 18:24    │ 2          │     │
├─────────────────────────────────────────────────┤
│  Estadísticas                                   │
│  ┌─────┐  ┌─────┐  ┌─────┐                      │
│  │  1  │  │  1  │  │ Hoy │                      │
│  │ IPs │  │Disp.│  │Antig│                      │
│  └─────┘  └─────┘  └─────┘                      │
└─────────────────────────────────────────────────┘
```

---

## 11. Próximos Pasos

```
[✅] Prompt 1: Arquitectura y decisiones
[✅] Prompt 2: Setup del proyecto
[✅] Prompt 3: Backend base + SQLite
[✅] Prompt 4: Registro (implementado)
[✅] Prompt 5: Login + sesiones (implementado)
[✅] Prompt 6: Seguridad (implementada en P2-P3)
[✅] Prompt 7: Frontend login/registro (ACTUAL)
[✅] Prompt 8: Dashboard + alertas (ACTUAL)
[ ] Prompt 9: Tests mínimos
[ ] Prompt 10: Revisión OWASP
[ ] Prompt 11: Documentación final
```

> [Nota profesor: El frontend y dashboard están completos e integrados. Los Prompts 6 y 8 ya están incluidos en la implementación actual.]

---

## 12. Verificación Final

| Componente | Estado |
|------------|--------|
| LoginForm | ✅ Completo |
| RegisterForm | ✅ Completo |
| Dashboard | ✅ Completo |
| useAuth hook | ✅ Funcional |
| API service | ✅ Integrado |
| Routing | ✅ Protegido |
| Estilos | ✅ Responsive |
| Proxy Vite | ✅ Funcionando |
| Build prod | ✅ 60KB gzipped |

---

**Fin del Prompt 7**

*El frontend está completamente operativo e integrado con el backend.*
