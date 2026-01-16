import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

/**
 * Provider de autenticación
 * Maneja estado global de sesión
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState([]);

  // Verificar sesión al cargar
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Verifica si hay una sesión activa
   */
  async function checkSession() {
    try {
      const data = await api.checkSession();
      if (data.authenticated) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Inicia sesión
   */
  async function login(username, password, deviceHash) {
    const data = await api.login(username, password, deviceHash);
    setUser(data.user);
    setLoginAlerts(data.alerts || []);
    return data;
  }

  /**
   * Registra nuevo usuario
   */
  async function register(userData) {
    const data = await api.register(userData);
    return data;
  }

  /**
   * Cierra sesión
   */
  async function logout() {
    await api.logout();
    setUser(null);
    setLoginAlerts([]);
  }

  /**
   * Limpia las alertas de login
   */
  function clearAlerts() {
    setLoginAlerts([]);
  }

  const value = {
    user,
    loading,
    loginAlerts,
    login,
    register,
    logout,
    clearAlerts,
    checkSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
