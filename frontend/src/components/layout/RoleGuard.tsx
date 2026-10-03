/**
 * RoleGuard Component
 * Enforces role-based route protection across the application.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Rol } from '../../types';

interface RoleGuardProps {
  allowedRoles: Rol[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#ECECEA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3BBCFD] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-600">Cargando sistema...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> send to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but role not allowed -> redirect to role home
  if (!allowedRoles.includes(currentUser.rol)) {
    if (currentUser.rol === 'ADMIN') {
      return <Navigate to="/resumen" replace />;
    }
    if (currentUser.rol === 'MAQUINA') {
      return <Navigate to="/turnos/nuevo" replace />;
    }
    if (currentUser.rol === 'LAVADOR') {
      return <Navigate to="/estaciones" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
