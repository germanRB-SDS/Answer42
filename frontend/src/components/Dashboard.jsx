import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../services/api';

export default function Dashboard() {
  const { user, logout, loginAlerts, clearAlerts } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getProfile();
      setProfile(data.user);
    } catch (err) {
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">{error}</div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Cerrar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Cerrar Sesión
        </button>
      </header>

      {/* Alertas de seguridad */}
      {loginAlerts && loginAlerts.length > 0 && (
        <div className="alerts-section">
          <h2>Alertas de Seguridad</h2>
          {loginAlerts.map((alert, index) => (
            <div
              key={index}
              className={`alert alert-${alert.severity === 'high' ? 'error' : 'warning'}`}
            >
              <strong>{alert.type === 'NEW_IP' ? 'Nueva IP' :
                       alert.type === 'NEW_DEVICE' ? 'Nuevo Dispositivo' :
                       'IP y Dispositivo Nuevos'}</strong>
              <p>{alert.message}</p>
              {alert.details && (
                <small>User-Agent: {alert.details.userAgent}</small>
              )}
            </div>
          ))}
          <button onClick={clearAlerts} className="btn btn-small">
            Descartar alertas
          </button>
        </div>
      )}

      {/* Información del usuario */}
      <section className="profile-section">
        <h2>Información de Usuario</h2>
        <div className="profile-card">
          <div className="profile-row">
            <span className="label">Usuario:</span>
            <span className="value">{profile?.username}</span>
          </div>
          <div className="profile-row">
            <span className="label">Email:</span>
            <span className="value">{profile?.email}</span>
          </div>
          <div className="profile-row">
            <span className="label">Cuenta creada:</span>
            <span className="value">{formatDate(profile?.createdAt)}</span>
          </div>
          <div className="profile-row">
            <span className="label">Último login:</span>
            <span className="value">{formatDate(profile?.lastLoginAt)}</span>
          </div>
        </div>
      </section>

      {/* Hash de contraseña (demo didáctica) */}
      <section className="hash-section">
        <h2>Hash de Contraseña (Demo)</h2>
        <div className="didactic-note">
          <strong>Nota educativa:</strong> Mostramos el hash solo con fines didácticos.
          En una aplicación real, NUNCA se expone el hash al frontend.
          <br /><br />
          <strong>Observa:</strong> El hash cambia completamente aunque la contraseña
          sea similar (efecto avalancha). Esto es Argon2id.
        </div>
        <div className="hash-display">
          <code>{profile?.passwordHash}</code>
        </div>
      </section>

      {/* Historial de IPs */}
      <section className="history-section">
        <h2>Historial de IPs ({profile?.ipHistory?.length || 0}/20)</h2>
        <div className="didactic-note">
          <strong>Limitaciones de IP:</strong> La IP no identifica usuarios de forma fiable.
          NAT, VPNs y IPs dinámicas hacen que múltiples usuarios compartan IPs
          o que un usuario tenga diferentes IPs.
        </div>
        <div className="history-table">
          <table>
            <thead>
              <tr>
                <th>IP</th>
                <th>Última conexión</th>
                <th>Conexiones</th>
              </tr>
            </thead>
            <tbody>
              {profile?.ipHistory?.map((entry, index) => (
                <tr key={index} className={index === 0 ? 'current' : ''}>
                  <td>{entry.ip}</td>
                  <td>{formatDate(entry.timestamp)}</td>
                  <td>{entry.count || 1}</td>
                </tr>
              ))}
              {(!profile?.ipHistory || profile.ipHistory.length === 0) && (
                <tr>
                  <td colSpan="3">No hay historial de IPs</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historial de dispositivos */}
      <section className="history-section">
        <h2>Historial de Dispositivos ({profile?.deviceHistory?.length || 0}/20)</h2>
        <div className="didactic-note">
          <strong>Limitaciones del fingerprinting:</strong> El hash de dispositivo
          es una aproximación. Muchos dispositivos pueden tener el mismo fingerprint,
          y actualizaciones del navegador pueden cambiarlo.
        </div>
        <div className="history-table">
          <table>
            <thead>
              <tr>
                <th>Device Hash</th>
                <th>User-Agent</th>
                <th>Última conexión</th>
                <th>Conexiones</th>
              </tr>
            </thead>
            <tbody>
              {profile?.deviceHistory?.map((entry, index) => (
                <tr key={index} className={index === 0 ? 'current' : ''}>
                  <td><code>{entry.hash}</code></td>
                  <td className="user-agent">{truncateUserAgent(entry.userAgent)}</td>
                  <td>{formatDate(entry.timestamp)}</td>
                  <td>{entry.count || 1}</td>
                </tr>
              ))}
              {(!profile?.deviceHistory || profile.deviceHistory.length === 0) && (
                <tr>
                  <td colSpan="4">No hay historial de dispositivos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="stats-section">
        <h2>Estadísticas</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{profile?.stats?.totalIps || 0}</span>
            <span className="stat-label">IPs únicas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{profile?.stats?.totalDevices || 0}</span>
            <span className="stat-label">Dispositivos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{profile?.stats?.accountAge || 'N/A'}</span>
            <span className="stat-label">Antigüedad</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// Helpers
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function truncateUserAgent(ua) {
  if (!ua) return 'Desconocido';
  if (ua.length > 50) return ua.substring(0, 47) + '...';
  return ua;
}
