/**
 * Authentication Context for Sistema de Turnos Car Wash
 * Autenticación contra el backend: access token en memoria y refresh token en cookie httpOnly.
 * Al recargar la página la sesión se restaura con POST /api/auth/refresh.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Usuario } from '../types';
import { ApiError, apiRequest, refreshSession, session, SessionPayload } from '../services/api';
import { mapUsuario } from '../services/mappers';

interface AuthContextType {
  currentUser: Usuario | null;
  isLoading: boolean;
  login: (
    usuario: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: Usuario }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Si la sesión no se puede renovar (expirada o usuario desactivado), volver al login.
    session.onExpired(() => setCurrentUser(null));

    let cancelled = false;
    refreshSession()
      .then(restored => {
        if (!cancelled && restored) setCurrentUser(mapUsuario(restored.user));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      session.onExpired(null);
    };
  }, []);

  const login = useCallback(async (usuario: string, password: string) => {
    try {
      const { data } = await apiRequest<{ data: SessionPayload }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { usuario: usuario.trim().toLowerCase(), password }
      });
      session.setToken(data.accessToken);
      const user = mapUsuario(data.user);
      setCurrentUser(user);
      return { success: true, user };
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo iniciar sesión. Intenta nuevamente.';
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    session.setToken(null);
    setCurrentUser(null);
    apiRequest('/auth/logout', { method: 'POST', auth: false }).catch(() => undefined);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
