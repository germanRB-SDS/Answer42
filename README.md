# Answer42 - Sistema de Autenticación Seguro

Proyecto didáctico para el taller **"AI + Desarrollo con Agentes LLM"** (DAW).

Implementa un sistema de login/registro con nivel de seguridad **6-7/10** aplicando buenas prácticas OWASP.

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Backend | Node.js + Express |
| Base de datos | SQLite (local) |
| Frontend | React + Vite |
| Autenticación | Cookies de sesión (httpOnly) |
| Hashing | Argon2id |

## Requisitos Previos

- Node.js 18+ instalado
- npm o yarn
- Puerto 3001 (backend) y 5173 (frontend) disponibles

## Instalación Rápida

```bash
# 1. Clonar e instalar dependencias
git clone <repo>
cd Answer42

# 2. Instalar backend
cd backend
npm install
cp .env.example .env  # Editar SESSION_SECRET si es necesario

# 3. Instalar frontend
cd ../frontend
npm install

# 4. Iniciar (en terminales separadas)
# Terminal 1 - Backend:
cd backend && npm run dev

# Terminal 2 - Frontend:
cd frontend && npm run dev
```

## Acceso

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health check:** http://localhost:3001/api/health

## Estructura del Proyecto

```
Answer42/
├── backend/
│   ├── src/
│   │   ├── config/       # Configuración (DB, sesiones, seguridad)
│   │   ├── middleware/   # Auth, validación, rate limiting
│   │   ├── routes/       # Endpoints API
│   │   ├── services/     # Lógica de negocio
│   │   └── utils/        # Logger, errores
│   ├── data/             # SQLite database
│   └── .env              # Variables de entorno (NO commitear)
├── frontend/
│   └── src/
│       ├── components/   # Login, Register, Dashboard
│       ├── hooks/        # useAuth
│       ├── services/     # API client
│       └── styles/       # CSS
└── docs/                 # Documentación del taller
```

## Funcionalidades

### Registro
- Validación de campos (usuario, email, contraseña)
- Hash Argon2id para contraseñas
- Registro de IP y dispositivo inicial

### Login
- Verificación de credenciales segura
- Rate limiting (5 intentos / 15 min)
- Bloqueo temporal tras 5 intentos fallidos
- Alertas de IP/dispositivo nuevo

### Dashboard Post-Login
- Información del usuario
- Hash de contraseña (demo didáctica)
- Historial de IPs (máx 20)
- Historial de dispositivos (máx 20)
- Alertas de seguridad

## Seguridad Implementada (OWASP)

| Medida | Implementación |
|--------|----------------|
| A01 Broken Access Control | Middleware auth en rutas protegidas |
| A02 Cryptographic Failures | Argon2id, cookies httpOnly/Secure/SameSite |
| A03 Injection | Prepared statements (better-sqlite3) |
| A05 Security Misconfiguration | helmet, CORS estricto |
| A07 Auth Failures | Rate limiting, lockout temporal |
| A09 Logging Failures | Winston logger, audit_log |

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/logout | Cerrar sesión |
| GET | /api/auth/session | Verificar sesión |
| GET | /api/user/profile | Obtener perfil (protegida) |
| GET | /api/health | Health check |

## Variables de Entorno

Ver `backend/.env.example` para la lista completa.

**Crítico:** Generar un `SESSION_SECRET` único:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Notas Didácticas

### Limitaciones de IP como identificador
- NAT/CGNAT: múltiples usuarios comparten IP
- IPs dinámicas: cambian con reconexión
- VPNs/Proxies: ocultan IP real

### Limitaciones de Device Fingerprinting
- No es único: muchos dispositivos tienen fingerprint similar
- Cambia con actualizaciones del navegador
- En localhost, todos los accesos parecen del mismo dispositivo

## Nivel de Seguridad 6-7/10

**Incluido:**
- Argon2id con parámetros seguros
- Cookies httpOnly/Secure/SameSite
- Rate limiting funcional
- Validación de inputs
- Headers de seguridad (helmet)
- CORS restrictivo
- Logging y auditoría

**Excluido (nivel 8+):**
- MFA (Multi-Factor Authentication)
- WAF (Web Application Firewall)
- CAPTCHA
- Notificaciones por email
- Certificados HTTPS (desarrollo local)

## Estado del Proyecto

Consulta el archivo **[PROMPT-STATUS-README.md](./PROMPT-STATUS-README.md)** para ver el estado actual de los prompts ejecutados y el progreso del proyecto.

## Licencia

MIT - Proyecto educativo para taller DAW
