/**
 * Authentication Context for Sistema de Turnos Car Wash
 * Handles login, session persistence, role guards, and deterministic demo credentials.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';
import { StorageService } from '../services/storage';

interface AuthContextType {
  currentUser: Usuario | null;
  isLoading: boolean;
  login: (usuario: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setDemoUser: (usuarioId: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = StorageService.getCurrentUser();
    if (saved) {
      // Re-verify that user is still active in storage
      const allUsers = StorageService.getUsuarios();
      const match = allUsers.find(u => u.idUsuario === saved.idUsuario && u.activo);
      if (match) {
        setCurrentUser(match);
      } else {
        StorageService.saveCurrentUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (usuario: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const allUsers = StorageService.getUsuarios();
    const cleanUser = usuario.trim().toLowerCase();
    const match = allUsers.find(u => u.usuario.toLowerCase() === cleanUser);

    if (!match) {
      return { success: false, error: 'Usuario no encontrado en el sistema.' };
    }

    if (!match.activo) {
      return { success: false, error: 'Esta cuenta se encuentra desactivada. Contacte al administrador.' };
    }

    // Verify deterministic password
    if (match.passwordHash && match.passwordHash !== password) {
      return { success: false, error: 'Contraseña incorrecta. Verifique sus credenciales.' };
    }

    setCurrentUser(match);
    StorageService.saveCurrentUser(match);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    StorageService.saveCurrentUser(null);
  };

  const setDemoUser = (usuarioId: number) => {
    const allUsers = StorageService.getUsuarios();
    const match = allUsers.find(u => u.idUsuario === usuarioId);
    if (match && match.activo) {
      setCurrentUser(match);
      StorageService.saveCurrentUser(match);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        logout,
        setDemoUser
      }}
    >
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
