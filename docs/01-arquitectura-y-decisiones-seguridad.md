# Prompt 1 – Arquitectura y Decisiones de Seguridad

**Proyecto:** Answer42 - Sistema de Autenticación Seguro (Taller DAW)
**Nivel de seguridad objetivo:** 6–7/10 (escala didáctica)
**Fecha:** Enero 2026

---

## Parámetros Editables

```yaml
# Copia y modifica estos valores para personalizar el proyecto
STACK_BACKEND: "Node.js + Express"
BBDD_LOCAL: "SQLite"
AUTH_MODE: "cookies sesión"
FRONTEND: "React + Vite"
ENTORNO_PRINCIPAL: "IntelliJ + Claude Code"
ENTORNO_ALTERNATIVO_ANTIGRAVITY: "VS Code + Cursor AI / Cline"
TIEMPO_RETO: "< 60 min"
```

---

## 1. Decisión del Stack Tecnológico

### 1.1 Backend: Node.js + Express

**¿Por qué Node.js + Express?**

| Criterio | Puntuación | Justificación |
|----------|------------|---------------|
| Curva de aprendizaje | ⭐⭐⭐⭐⭐ | JavaScript único para full-stack |
| Velocidad de setup | ⭐⭐⭐⭐⭐ | `npm init` + pocas dependencias |
| Ecosistema seguridad | ⭐⭐⭐⭐ | helmet, express-rate-limit, bcrypt nativos |
| Documentación OWASP | ⭐⭐⭐⭐⭐ | Cheat sheets específicos para Node |
| Tiempo en taller | ⭐⭐⭐⭐⭐ | MVP en < 30 min |

**Alternativas evaluadas:**

| Stack | Pros | Contras para taller |
|-------|------|---------------------|
| Spring Boot | Seguridad enterprise, tipado fuerte | Setup lento, requiere conocer Java/Kotlin |
| Python + Flask | Simple, legible | Ecosistema auth menos maduro |
| Go + Gin | Muy rápido, compilado | Curva de aprendizaje para DAW |

**Decisión:** Node.js + Express por velocidad de desarrollo y stack unificado JS.

---

### 1.2 Base de Datos: SQLite

**¿Por qué SQLite?**

| Criterio | Puntuación | Justificación |
|----------|------------|---------------|
| Zero config | ⭐⭐⭐⭐⭐ | Sin servidor, archivo único |
| Portabilidad | ⭐⭐⭐⭐⭐ | Se puede copiar el .db |
| Suficiente para taller | ⭐⭐⭐⭐⭐ | ACID compliant, SQL estándar |
| Seguridad local | ⭐⭐⭐⭐ | Sin exposición de puertos |

**Alternativas evaluadas:**

| BBDD | Pros | Contras para taller |
|------|------|---------------------|
| PostgreSQL local | Más robusto, mejor para producción | Requiere instalación, config |
| MySQL | Popular, bien documentado | Overhead innecesario para local |
| MongoDB | Flexible, JSON nativo | NoSQL añade complejidad conceptual |

**Decisión:** SQLite por simplicidad absoluta y cero configuración.

> [Nota profesor: SQLite es perfecto para enseñar conceptos. En producción real, migrar a PostgreSQL es trivial con un ORM como Prisma o Sequelize.]

---

### 1.3 Frontend: React + Vite

**¿Por qué React + Vite?**

| Criterio | Puntuación | Justificación |
|----------|------------|---------------|
| Velocidad dev | ⭐⭐⭐⭐⭐ | HMR instantáneo con Vite |
| Ecosistema | ⭐⭐⭐⭐⭐ | Componentes, hooks, estado |
| Empleabilidad | ⭐⭐⭐⭐⭐ | Framework más demandado |
| Seguridad XSS | ⭐⭐⭐⭐ | JSX escapa por defecto |

**Decisión:** React + Vite por velocidad de desarrollo y protección XSS nativa.

---

### 1.4 Modo de Autenticación: Cookies de Sesión vs JWT

**Esta es la decisión más importante de seguridad. Analicemos:**

#### Opción A: JWT (JSON Web Tokens)

```
┌─────────┐     POST /login        ┌─────────┐
│ Cliente │ ──────────────────────▶│ Servidor│
│         │◀────────────────────── │         │
└─────────┘   { token: "eyJ..." }  └─────────┘
     │
     │  Guarda en localStorage
     ▼
┌─────────────────────────────────────────────┐
│  localStorage.setItem("token", "eyJ...")    │
│  ⚠️  Vulnerable a XSS                       │
└─────────────────────────────────────────────┘
```

| Aspecto | Evaluación |
|---------|------------|
| Stateless | ✅ No requiere almacén de sesiones |
| XSS vulnerable | ❌ Si se guarda en localStorage |
| CSRF | ✅ Inmune (no se envía automáticamente) |
| Revocación | ❌ Compleja (requiere blacklist) |
| Complejidad | ❌ Mayor para principiantes |

#### Opción B: Cookies de Sesión (httpOnly)

```
┌─────────┐     POST /login        ┌─────────┐
│ Cliente │ ──────────────────────▶│ Servidor│
│         │◀────────────────────── │         │
└─────────┘   Set-Cookie: sid=abc  └─────────┘
                 httpOnly; Secure
                 SameSite=Strict
     │
     │  Cookie automática (NO accesible por JS)
     ▼
┌─────────────────────────────────────────────┐
│  document.cookie → ❌ No puede leer sid     │
│  ✅ Protegido contra XSS                    │
└─────────────────────────────────────────────┘
```

| Aspecto | Evaluación |
|---------|------------|
| Stateful | ⚠️ Requiere almacén de sesiones (ok para local) |
| XSS protegido | ✅ httpOnly impide acceso JS |
| CSRF | ⚠️ Requiere protección adicional |
| Revocación | ✅ Trivial (borrar sesión del store) |
| Complejidad | ✅ Más simple para principiantes |

#### Decisión Final: **Cookies de Sesión**

**Razones:**

1. **Seguridad por defecto:** httpOnly + Secure + SameSite=Strict
2. **Didáctica:** Más fácil de explicar el flujo
3. **Local-first:** No necesitamos stateless para un servidor local
4. **OWASP recomienda:** Cookies con flags correctos sobre JWT en localStorage

> [Nota profesor: JWT es válido en arquitecturas distribuidas/microservicios. Para monolito local, cookies son más seguras y simples. Explicar que JWT en httpOnly cookie ES una opción válida pero añade complejidad.]

**Referencia OWASP:** [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React App (Vite)                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │   │
│  │  │   Login     │  │  Registro   │  │  Dashboard Post-Login│ │   │
│  │  │   Form      │  │    Form     │  │  (datos + alertas)   │ │   │
│  │  └─────────────┘  └─────────────┘  └──────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              │ HTTP (fetch con credentials)         │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      SERVIDOR (Node + Express)                       │
│  Puerto: 3001                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Middlewares                                │ │
│  │  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌─────────────┐ │ │
│  │  │ helmet  │ │  cors   │ │  rate  │ │ session│ │    csrf     │ │ │
│  │  │(headers)│ │(origins)│ │ limit  │ │(cookies)│ │ (tokens)    │ │ │
│  │  └─────────┘ └─────────┘ └────────┘ └────────┘ └─────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                        Rutas API                                │ │
│  │  POST /api/auth/register  →  Crear usuario                      │ │
│  │  POST /api/auth/login     →  Iniciar sesión                     │ │
│  │  POST /api/auth/logout    →  Cerrar sesión                      │ │
│  │  GET  /api/user/profile   →  Datos post-login (protegida)       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Servicios                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │ │
│  │  │ AuthService │  │ UserService │  │ DeviceFingerprintService│ │ │
│  │  │ (hash,verify│  │ (CRUD, IP   │  │ (generar/validar device)│ │ │
│  │  │  sessions)  │  │  history)   │  │                         │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS (SQLite)                          │
│  Archivo: ./data/answer42.db                                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Tabla: users                                                   │ │
│  │  ─────────────────────────────────────────────────────────────  │ │
│  │  id            INTEGER PRIMARY KEY                              │ │
│  │  username      TEXT UNIQUE NOT NULL                             │ │
│  │  email         TEXT UNIQUE NOT NULL                             │ │
│  │  password_hash TEXT NOT NULL                                    │ │
│  │  ip_history    TEXT (JSON array, max 20)                        │ │
│  │  device_history TEXT (JSON array, max 20)                       │ │
│  │  created_at    DATETIME                                         │ │
│  │  updated_at    DATETIME                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Tabla: sessions                                                │ │
│  │  ─────────────────────────────────────────────────────────────  │ │
│  │  sid           TEXT PRIMARY KEY                                 │ │
│  │  sess          TEXT (JSON session data)                         │ │
│  │  expired       DATETIME                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Tabla: audit_log                                               │ │
│  │  ─────────────────────────────────────────────────────────────  │ │
│  │  id            INTEGER PRIMARY KEY                              │ │
│  │  user_id       INTEGER                                          │ │
│  │  action        TEXT (login, logout, register, failed_login)     │ │
│  │  ip_address    TEXT                                             │ │
│  │  device_hash   TEXT                                             │ │
│  │  details       TEXT (JSON)                                      │ │
│  │  created_at    DATETIME                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Estructura de Directorios Propuesta

```
Answer42/
├── docs/                          # Documentación
│   └── 01-arquitectura-*.md
├── backend/
│   ├── package.json
│   ├── .env.example               # Variables de entorno (plantilla)
│   ├── .env                       # Variables reales (NO commitear)
│   ├── src/
│   │   ├── index.js               # Entry point
│   │   ├── config/
│   │   │   ├── database.js        # Configuración SQLite
│   │   │   ├── session.js         # Configuración sesiones
│   │   │   └── security.js        # helmet, cors, rate-limit
│   │   ├── middleware/
│   │   │   ├── auth.js            # Verificar sesión
│   │   │   ├── csrf.js            # Protección CSRF
│   │   │   ├── validate.js        # Validación inputs
│   │   │   └── rateLimiter.js     # Rate limiting
│   │   ├── routes/
│   │   │   ├── auth.js            # /api/auth/*
│   │   │   └── user.js            # /api/user/*
│   │   ├── services/
│   │   │   ├── authService.js     # Lógica autenticación
│   │   │   ├── userService.js     # Lógica usuarios
│   │   │   └── deviceService.js   # Fingerprinting
│   │   ├── models/
│   │   │   └── user.js            # Modelo usuario
│   │   └── utils/
│   │       ├── logger.js          # Winston logger
│   │       └── errors.js          # Errores personalizados
│   ├── data/
│   │   └── .gitkeep               # SQLite DB aquí
│   └── tests/
│       ├── auth.test.js
│       └── security.test.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── LoginForm.jsx
│       │   ├── RegisterForm.jsx
│       │   └── Dashboard.jsx
│       ├── hooks/
│       │   └── useAuth.js
│       ├── services/
│       │   └── api.js             # Fetch wrapper
│       └── styles/
│           └── main.css
└── README.md
```

---

## 3. Decisiones de Seguridad según OWASP

### 3.1 Mapeo OWASP Top 10 (2021)

| # | Vulnerabilidad OWASP | Mitigación en Answer42 | Prioridad |
|---|---------------------|------------------------|-----------|
| A01 | Broken Access Control | Middleware auth en rutas protegidas | 🔴 Alta |
| A02 | Cryptographic Failures | Argon2id para passwords, HTTPS local | 🔴 Alta |
| A03 | Injection | Prepared statements (better-sqlite3), validación | 🔴 Alta |
| A04 | Insecure Design | Threat model, principio mínimo privilegio | 🟡 Media |
| A05 | Security Misconfiguration | helmet, CORS estricto, .env | 🟡 Media |
| A06 | Vulnerable Components | npm audit, dependencias mínimas | 🟡 Media |
| A07 | Auth Failures | Rate limiting, sesiones seguras, no enumerar usuarios | 🔴 Alta |
| A08 | Data Integrity Failures | CSP headers, SRI en scripts | 🟢 Baja |
| A09 | Logging Failures | Winston logger, audit_log table | 🟡 Media |
| A10 | SSRF | N/A (no requests externos) | ⚪ N/A |

### 3.2 Hashing de Contraseñas: Argon2id

**¿Por qué Argon2id sobre bcrypt?**

```
┌────────────────────────────────────────────────────────────────┐
│                    Comparativa Hashing                         │
├──────────────┬─────────────┬─────────────┬────────────────────┤
│ Algoritmo    │ Memory-hard │ GPU resist  │ Recomendación 2024 │
├──────────────┼─────────────┼─────────────┼────────────────────┤
│ MD5/SHA      │ ❌          │ ❌          │ ❌ NUNCA usar      │
│ bcrypt       │ ⚠️ Limitado │ ✅          │ ✅ Aceptable       │
│ scrypt       │ ✅          │ ✅          │ ✅ Bueno           │
│ Argon2id     │ ✅          │ ✅          │ ✅ Recomendado     │
└──────────────┴─────────────┴─────────────┴────────────────────┘
```

**Parámetros Argon2id para taller (balance seguridad/velocidad):**

```javascript
const argon2Options = {
  type: argon2.argon2id,    // Variante híbrida (resistente a side-channel + GPU)
  memoryCost: 65536,        // 64 MB de RAM
  timeCost: 3,              // 3 iteraciones
  parallelism: 4            // 4 hilos paralelos
};
// Tiempo aproximado: 200-400ms por hash (aceptable para login)
```

> [Nota profesor: bcrypt sigue siendo válido. Elegimos Argon2id porque es el estándar actual (ganador Password Hashing Competition 2015) y tiene mejor resistencia a ataques con hardware especializado.]

**Referencia OWASP:** [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

### 3.3 Rate Limiting: Protección Fuerza Bruta

```javascript
// Configuración express-rate-limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // 5 intentos por ventana
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true,      // Headers RateLimit-*
  legacyHeaders: false,
  // Identificador: IP (limitación conocida, ver threat model)
  keyGenerator: (req) => req.ip
});

// Aplicar solo a login
app.post('/api/auth/login', loginLimiter, loginController);
```

**Capas de protección:**

| Capa | Mecanismo | Protege contra |
|------|-----------|----------------|
| 1 | Rate limit por IP | Fuerza bruta básica |
| 2 | Delay incremental | Ataques lentos |
| 3 | Lockout temporal (5 fallos) | Ataques dirigidos |
| 4 | Logging de intentos | Detección/forense |

> [Nota profesor: En producción real añadiríamos CAPTCHA tras N intentos y notificación al usuario por email. Omitimos para simplificar el taller.]

---

### 3.4 Configuración de Sesiones

```javascript
const sessionConfig = {
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './data'
  }),
  secret: process.env.SESSION_SECRET,  // Mínimo 32 caracteres aleatorios
  name: 'sid',                         // Nombre genérico (no revelar tecnología)
  resave: false,
  saveUninitialized: false,            // Solo crear sesión si hay datos
  cookie: {
    httpOnly: true,                    // ✅ Inaccesible desde JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS en prod
    sameSite: 'strict',                // ✅ Protección CSRF
    maxAge: 24 * 60 * 60 * 1000        // 24 horas
  }
};
```

**Flags de cookie explicados:**

| Flag | Valor | Propósito |
|------|-------|-----------|
| `httpOnly` | `true` | JS no puede leer la cookie → protege XSS |
| `secure` | `true` (prod) | Solo enviar por HTTPS |
| `sameSite` | `strict` | No enviar en requests cross-origin → CSRF |
| `maxAge` | 24h | Expiración automática |

---

### 3.5 Protección CSRF

Aunque `sameSite: strict` mitiga CSRF, añadimos token CSRF como defensa en profundidad:

```javascript
// Backend: generar token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Frontend: incluir en headers
fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken  // Obtenido previamente
  },
  credentials: 'include',
  body: JSON.stringify({ username, password })
});
```

---

### 3.6 Validación de Inputs

```javascript
// Usando express-validator
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Usuario: 3-30 caracteres alfanuméricos'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),

  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password: mín 8 chars, mayúscula, minúscula, número'),

  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden')
];
```

**Reglas de validación:**

| Campo | Reglas | Razón |
|-------|--------|-------|
| username | 3-30 chars, alfanumérico + `_` | Prevenir injection, normalizar |
| email | Formato válido, normalizado | Prevenir duplicados por variación |
| password | 8+ chars, complejidad | NIST 800-63B (actualizado) |

---

### 3.7 Headers de Seguridad (helmet)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],       // No inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"], // Permitir estilos inline (React)
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],  // Prevenir clickjacking
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

---

### 3.8 CORS (desarrollo local)

```javascript
const corsOptions = {
  origin: 'http://localhost:5173',  // Solo el frontend Vite
  credentials: true,                 // Permitir cookies
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token']
};
app.use(cors(corsOptions));
```

> [Nota profesor: En producción, origin sería el dominio real. NUNCA usar `origin: '*'` con `credentials: true`.]

---

## 4. Mini Threat Model

### 4.1 Activos a Proteger

| Activo | Valor | Ubicación |
|--------|-------|-----------|
| Credenciales usuarios | 🔴 Alto | Tabla `users.password_hash` |
| Datos personales (email) | 🟡 Medio | Tabla `users.email` |
| Sesiones activas | 🔴 Alto | Tabla `sessions`, cookies |
| Logs de auditoría | 🟡 Medio | Tabla `audit_log` |

### 4.2 Actores de Amenaza (contexto taller)

| Actor | Motivación | Capacidad | Probabilidad |
|-------|------------|-----------|--------------|
| Estudiante curioso | Aprender, probar límites | Baja | 🟡 Media |
| Script kiddie | Diversión, vandalismo | Media | 🟢 Baja (local) |
| Atacante externo | Robo datos | Alta | ⚪ N/A (local) |

### 4.3 Amenazas y Mitigaciones (STRIDE)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STRIDE THREAT MODEL                              │
├─────────────┬───────────────────────┬───────────────────────────────┤
│ Categoría   │ Amenaza               │ Mitigación Answer42           │
├─────────────┼───────────────────────┼───────────────────────────────┤
│ Spoofing    │ Robo de sesión        │ httpOnly, Secure, SameSite    │
│ (Suplantación)│ Fuerza bruta        │ Rate limiting, Argon2id       │
├─────────────┼───────────────────────┼───────────────────────────────┤
│ Tampering   │ Modificar requests    │ CSRF tokens, validación       │
│ (Manipulación)│ SQL Injection       │ Prepared statements           │
├─────────────┼───────────────────────┼───────────────────────────────┤
│ Repudiation │ Negar acciones        │ audit_log con timestamps      │
│ (Repudio)   │                       │                               │
├─────────────┼───────────────────────┼───────────────────────────────┤
│ Information │ Filtrar passwords     │ Solo devolver hash (demo)     │
│ Disclosure  │ Enumerar usuarios     │ Mensajes genéricos            │
│ (Filtración)│ Stack traces          │ Error handler personalizado   │
├─────────────┼───────────────────────┼───────────────────────────────┤
│ Denial of   │ Agotar recursos       │ Rate limiting                 │
│ Service     │ Spam registros        │ Validación, límites           │
├─────────────┼───────────────────────┼───────────────────────────────┤
│ Elevation   │ Acceder sin auth      │ Middleware auth en rutas      │
│ of Privilege│ Modificar otros users │ Verificar ownership           │
└─────────────┴───────────────────────┴───────────────────────────────┘
```

### 4.4 Riesgos Aceptados (Nivel 6-7/10)

| Riesgo | Razón de aceptación | Mitigación producción |
|--------|---------------------|----------------------|
| Sin HTTPS local | Complejidad certificados | Let's Encrypt en deploy |
| IP como identificador rate-limit | Suficiente para demo | Redis + fingerprinting |
| Sin MFA | Complejidad para taller | TOTP o WebAuthn |
| Sin CAPTCHA | Complejidad UI | reCAPTCHA v3 |
| Sin notificación email | Requiere SMTP | SendGrid/SES |

---

## 5. Justificación Nivel de Seguridad 6-7/10

### 5.1 Escala de Referencia

```
Nivel 1-2: Sin seguridad (passwords en texto plano, sin validación)
Nivel 3-4: Seguridad básica (MD5/SHA256, alguna validación)
Nivel 5:   Seguridad mínima aceptable (bcrypt, HTTPS)
Nivel 6-7: Seguridad sólida didáctica ← NUESTRO OBJETIVO
Nivel 8-9: Producción enterprise (WAF, MFA, SOC)
Nivel 10:  Máxima (air-gapped, HSM, auditorías constantes)
```

### 5.2 Por qué 6-7 es el objetivo correcto

**Incluido (nivel 6-7):**
- ✅ Argon2id con parámetros adecuados
- ✅ Sesiones con cookies seguras (httpOnly/Secure/SameSite)
- ✅ Rate limiting funcional
- ✅ Validación de inputs completa
- ✅ Protección XSS (React + CSP)
- ✅ Protección CSRF (tokens + SameSite)
- ✅ Headers de seguridad (helmet)
- ✅ CORS restrictivo
- ✅ Logging y auditoría básica
- ✅ Errores sin filtrar información
- ✅ Prepared statements (sin SQL injection)

**Excluido (nivel 8+):**
- ❌ MFA (Multi-Factor Authentication)
- ❌ WAF (Web Application Firewall)
- ❌ Monitoreo en tiempo real (SIEM)
- ❌ Penetration testing formal
- ❌ Certificaciones (SOC2, ISO27001)
- ❌ HSM para secretos
- ❌ Zero-trust architecture

### 5.3 Mapa Visual

```
┌────────────────────────────────────────────────────────────────────┐
│                    ESCALA DE SEGURIDAD                             │
│                                                                    │
│  1    2    3    4    5    6    7    8    9    10                  │
│  ├────┼────┼────┼────┼────┼════╪════┼────┼────┤                  │
│  │         │         │    ▲    │         │    │                  │
│  │  NUNCA  │  LEGACY │    │    │PRODUCCIÓN│ENTERPRISE            │
│  │  USAR   │  (deuda)│ TALLER │ ESTÁNDAR │  CRÍTICO             │
│  │         │         │OBJETIVO│          │                       │
│  └─────────┴─────────┴────────┴──────────┴───────────────────────│
│                              │                                    │
│                    Answer42 ─┘                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 6. Entorno Alternativo "Antigravity"

### 6.1 Definición

**Antigravity:** Configuración alternativa de IDE/agente que reduce fricción y acelera el desarrollo, especialmente para tareas repetitivas o boilerplate.

### 6.2 Evaluación de Alternativas

| Entorno | Pros | Contras | Recomendación |
|---------|------|---------|---------------|
| **IntelliJ + Claude Code** (principal) | Robusto, refactoring potente, integración Git excelente | Más pesado, curva de aprendizaje | ✅ Recomendado para proyecto completo |
| **VS Code + Cursor AI** | Ligero, AI nativa, autocompletado excelente | Menos refactoring tools | ✅ Alternativa válida |
| **VS Code + Cline** | Open source, personalizable | Menos pulido que Cursor | ⚠️ Para usuarios avanzados |
| **Neovim + Copilot** | Máxima velocidad, keyboard-driven | Curva muy alta | ❌ No para taller DAW |
| **Windsurf (Codeium)** | Gratis, buen AI | Menos maduro | ⚠️ Evaluar |

### 6.3 Recomendación Antigravity

**Para este taller:** VS Code + Cursor AI como alternativa

**Razones:**
1. Setup en 2 minutos (vs IntelliJ que requiere plugins)
2. AI integrada sin configuración adicional
3. Funciona perfectamente con Node.js + React
4. Los estudiantes probablemente ya lo conocen

**Cuándo usar IntelliJ:** Si el estudiante ya lo tiene configurado o planea trabajar con Java/Kotlin después.

---

## 7. Notas Didácticas sobre IP y Device Fingerprinting

### 7.1 Limitaciones de IP como Identificador

```
⚠️ ADVERTENCIA DIDÁCTICA

La IP NO es un identificador fiable de usuario porque:

1. NAT/CGNAT: Múltiples usuarios comparten IP pública
   └─ Ejemplo: Todos en la clase tienen la misma IP

2. IPs dinámicas: Cambian con reconexión
   └─ Ejemplo: Reiniciar router = nueva IP

3. VPNs/Proxies: Ocultan IP real
   └─ Ejemplo: VPN muestra IP de otro país

4. IPv6 temporal: Direcciones que rotan por privacidad

CONCLUSIÓN: Usar IP para alertas informativas, NUNCA para bloquear acceso.
```

### 7.2 Limitaciones de Device Fingerprinting en Web

```
⚠️ ADVERTENCIA DIDÁCTICA

El fingerprinting web tiene limitaciones severas:

1. No es único: Muchos dispositivos tienen fingerprint similar
   └─ Ejemplo: Todos los MacBooks con Safari parecen iguales

2. Cambia con actualizaciones: Nueva versión browser = nuevo fingerprint

3. Modo incógnito: Algunos browsers normalizan fingerprint

4. Privacidad: Puede violar GDPR si no hay consentimiento

5. En localhost: Todos los accesos vienen del mismo "dispositivo"

CONCLUSIÓN: Útil como factor adicional, NUNCA como único identificador.
```

### 7.3 Implementación Didáctica

Generaremos un "device hash" básico combinando:
- User-Agent
- Idioma del navegador
- Resolución de pantalla
- Timezone

```javascript
// Ejemplo simplificado (frontend)
const getDeviceFingerprint = () => {
  const data = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('|');

  return sha256(data);  // Hash para no exponer datos raw
};
```

> [Nota profesor: Esto es una versión simplificada. Librerías como FingerprintJS son más robustas pero añaden complejidad. Para el taller, nuestra versión ilustra el concepto.]

---

## 8. Checklist Pre-Implementación

Antes de pasar al Prompt 2, verificar:

- [ ] Node.js instalado (v18+ recomendado)
- [ ] npm/yarn disponible
- [ ] IntelliJ IDEA o VS Code instalado
- [ ] Claude Code o Cursor AI configurado
- [ ] Git configurado
- [ ] Puerto 3001 (backend) y 5173 (frontend) disponibles

---

## 9. Próximos Pasos (Mapa de Ruta)

> **Estado actualizado:** Consulta [PROMPT-STATUS-README.md](../PROMPT-STATUS-README.md) para ver el progreso actual del proyecto.

```
[ ] Prompt 1: Arquitectura y decisiones de seguridad
[ ] Prompt 2: Setup repositorio + estructura de carpetas
[ ] Prompt 3: Backend base + configuración SQLite
[ ] Prompt 4: Sistema de registro
[ ] Prompt 5: Sistema de login + sesiones
[ ] Prompt 6: Seguridad (rate limiting, CSRF, headers)
[ ] Prompt 7: Frontend login/registro
[ ] Prompt 8: Dashboard post-login + alertas
[ ] Prompt 9: Tests mínimos
[ ] Prompt 10: Revisión OWASP + hardening
[ ] Prompt 11: Documentación final
```

---

**Fin del Prompt 1**

*Documento generado para el taller "AI + Desarrollo con Agentes LLM" - DAW*
