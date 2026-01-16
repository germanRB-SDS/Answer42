# Prompt 2 – Setup del Proyecto y Estructura Base

**Proyecto:** Answer42 - Sistema de Autenticación Seguro (Taller DAW)
**Fecha:** Enero 2026

---

## Resumen de lo Generado

Este prompt ha creado la estructura completa del proyecto con configuración segura por defecto.

---

## 1. Estructura de Carpetas Creada

```
Answer42/
├── package.json              # Scripts raíz para desarrollo
├── README.md                 # Documentación principal
├── .gitignore                # Archivos excluidos (seguro)
│
├── docs/
│   ├── 01-arquitectura-*.md  # Prompt 1
│   └── 02-setup-proyecto.md  # Este documento
│
├── backend/
│   ├── package.json          # Dependencias Node.js
│   ├── .env.example          # Plantilla de variables
│   ├── .env                  # Variables reales (ignorado por git)
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── config/
│   │   │   ├── database.js   # SQLite config
│   │   │   ├── session.js    # Cookies/sesiones
│   │   │   └── security.js   # helmet, cors, rate-limit
│   │   ├── middleware/
│   │   │   ├── auth.js       # Verificación de sesión
│   │   │   └── validate.js   # Validación de inputs
│   │   ├── routes/
│   │   │   ├── auth.js       # /api/auth/*
│   │   │   └── user.js       # /api/user/*
│   │   ├── services/
│   │   │   ├── authService.js    # Registro/login
│   │   │   ├── userService.js    # Perfil/historial
│   │   │   ├── auditService.js   # Logging auditoría
│   │   │   └── deviceService.js  # Fingerprinting
│   │   └── utils/
│   │       ├── logger.js     # Winston config
│   │       └── errors.js     # Manejo de errores
│   ├── data/
│   │   └── .gitkeep          # Directorio para SQLite
│   └── tests/                # Tests (vacío por ahora)
│
└── frontend/
    ├── package.json          # Dependencias React
    ├── vite.config.js        # Configuración Vite + proxy
    ├── index.html            # HTML base
    └── src/
        ├── main.jsx          # Entry point React
        ├── App.jsx           # Router + providers
        ├── components/
        │   ├── LoginForm.jsx
        │   ├── RegisterForm.jsx
        │   └── Dashboard.jsx
        ├── hooks/
        │   └── useAuth.jsx   # Context de autenticación
        ├── services/
        │   └── api.js        # Cliente HTTP
        └── styles/
            └── main.css      # Estilos
```

---

## 2. Dependencias Instaladas

### Backend (Node.js)

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| express | ^4.21.0 | Framework HTTP |
| better-sqlite3 | ^11.3.0 | Base de datos SQLite |
| argon2 | ^0.41.1 | Hashing de contraseñas |
| express-session | ^1.18.0 | Manejo de sesiones |
| connect-sqlite3 | ^0.9.15 | Store de sesiones en SQLite |
| express-rate-limit | ^7.4.0 | Rate limiting |
| helmet | ^7.1.0 | Headers de seguridad |
| cors | ^2.8.5 | Control de origen |
| express-validator | ^7.2.0 | Validación de inputs |
| cookie-parser | ^1.4.6 | Parsing de cookies |
| winston | ^3.14.0 | Logging |
| dotenv | ^16.4.5 | Variables de entorno |

### Frontend (React)

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | DOM rendering |
| react-router-dom | ^6.26.0 | Routing |
| vite | ^5.4.0 | Build tool |
| @vitejs/plugin-react | ^4.3.1 | Plugin React para Vite |

---

## 3. Configuración de Seguridad Aplicada

### 3.1 Variables de Entorno (.env)

```bash
# Crítico: SESSION_SECRET generado automáticamente
SESSION_SECRET=<32 bytes hex aleatorios>

# CORS restrictivo
FRONTEND_URL=http://localhost:5173

# Rate limiting configurado
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5
```

> [Nota profesor: El archivo .env NUNCA debe commitearse. El .gitignore ya lo excluye.]

### 3.2 .gitignore Seguro

Excluye:
- `node_modules/`
- `.env` y variantes
- Archivos `.db` (base de datos)
- Logs
- Certificados y claves
- Configuración de IDE

### 3.3 Headers de Seguridad (helmet)

Configurados en `backend/src/config/security.js`:
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HSTS (en producción)

### 3.4 CORS Restrictivo

```javascript
origin: 'http://localhost:5173'  // Solo el frontend
credentials: true                 // Permite cookies
```

### 3.5 Sesiones Seguras

```javascript
cookie: {
  httpOnly: true,      // No accesible desde JS
  secure: false,       // HTTPS solo en producción
  sameSite: 'strict',  // Protección CSRF
  maxAge: 86400000     // 24 horas
}
```

---

## 4. Instrucciones de Instalación

### Paso 1: Instalar dependencias

```bash
# Desde la raíz del proyecto
npm run install:all

# O manualmente:
cd backend && npm install
cd ../frontend && npm install
```

### Paso 2: Configurar variables de entorno

```bash
cd backend
cp .env.example .env
# El SESSION_SECRET ya está generado
```

### Paso 3: Iniciar servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

### Paso 4: Verificar instalación

```bash
# Health check
curl http://localhost:3001/api/health
# Respuesta: {"status":"ok","timestamp":"...","environment":"development"}
```

---

## 5. Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos JS | camelCase | `authService.js` |
| Componentes React | PascalCase | `LoginForm.jsx` |
| Variables | camelCase | `sessionConfig` |
| Constantes | UPPER_SNAKE | `MAX_HISTORY_SIZE` |
| Rutas API | kebab-case | `/api/auth/login` |
| Variables entorno | UPPER_SNAKE | `SESSION_SECRET` |

---

## 6. Próximos Pasos

El proyecto está estructurado y listo para desarrollar. Los siguientes prompts implementarán:

```
[✅] Prompt 1: Arquitectura y decisiones
[✅] Prompt 2: Setup del proyecto (ACTUAL)
[ ] Prompt 3: Backend base + configuración SQLite
[ ] Prompt 4: Sistema de registro
[ ] Prompt 5: Sistema de login + sesiones
[ ] Prompt 6: Seguridad avanzada
[ ] Prompt 7: Frontend login/registro
[ ] Prompt 8: Dashboard post-login + alertas
[ ] Prompt 9: Tests mínimos
[ ] Prompt 10: Revisión OWASP
[ ] Prompt 11: Documentación final
```

---

## 7. Verificación de Requisitos

| Requisito | Estado |
|-----------|--------|
| Estructura de carpetas | ✅ Creada |
| Backend Node.js + Express | ✅ Configurado |
| Frontend React + Vite | ✅ Configurado |
| Variables de entorno | ✅ .env generado |
| .gitignore seguro | ✅ Configurado |
| Documentación básica | ✅ README.md |
| Scripts de desarrollo | ✅ package.json |

---

**Fin del Prompt 2**

*El proyecto está listo para implementar la lógica de autenticación en los siguientes prompts.*
