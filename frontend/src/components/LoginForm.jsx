import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { generateDeviceHash } from '../services/api';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Limpiar error al escribir
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Generar device hash
      const deviceHash = await generateDeviceHash();

      // Intentar login
      await login(formData.username, formData.password, deviceHash);

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      // Mostrar error genérico (el backend ya envía mensajes seguros)
      setError(err.message || 'Error al iniciar sesión');

      // Si es rate limit, mostrar mensaje especial
      if (err.code === 'RATE_LIMIT_EXCEEDED') {
        setError('Demasiados intentos. Por favor, espera unos minutos.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Iniciar Sesión</h1>
        <p className="auth-subtitle">Answer42 - Sistema de Autenticación Seguro</p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>

        {/* Nota didáctica */}
        <div className="didactic-note">
          <strong>Nota de seguridad:</strong> Este formulario implementa protección
          contra fuerza bruta (rate limiting) y no revela si el usuario existe.
        </div>
      </div>
    </div>
  );
}
