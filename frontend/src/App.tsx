/**
 * Sistema de Turnos Car Wash - Main Application Entry & Routing
 * Conforms to Spec Maestro Definitivo
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CarWashProvider } from './context/CarWashContext';

// Layouts & Guards
import { AppLayout } from './components/layout/AppLayout';
import { KioskLayout } from './components/layout/KioskLayout';
import { RoleGuard } from './components/layout/RoleGuard';
import { Toast } from './components/common/Toast';

// Pages
import { LoginPage } from './pages/LoginPage';
import { ResumenPage } from './pages/ResumenPage';
import { NuevoTurnoPage } from './pages/NuevoTurnoPage';
import { ColaEsperaPage } from './pages/ColaEsperaPage';
import { EstacionesPage } from './pages/EstacionesPage';
import { MonitorPublicoPage } from './pages/MonitorPublicoPage';
import { HistorialPage } from './pages/HistorialPage';
import { ClientesPage } from './pages/ClientesPage';
import { UsuariosPage } from './pages/UsuariosPage';

/**
 * Root Redirector: Sends user to role home or login
 */
const RootRedirect: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#ECECEA]">
        <div className="w-10 h-10 border-4 border-[#3BBCFD] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  switch (currentUser.rol) {
    case 'ADMIN':
      return <Navigate to="/resumen" replace />;
    case 'MAQUINA':
      return <Navigate to="/turnos/nuevo" replace />;
    case 'LAVADOR':
      return <Navigate to="/estaciones" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

/**
 * Dynamic Layout Wrapper:
 * Renders KioskLayout for MAQUINA role and AppLayout for ADMIN / LAVADOR roles.
 */
const MainLayoutWrapper: React.FC = () => {
  const { currentUser } = useAuth();

  if (currentUser?.rol === 'MAQUINA') {
    return <KioskLayout />;
  }

  return <AppLayout />;
};

export default function App() {
  return (
    <AuthProvider>
      <CarWashProvider>
        <Toast />
        <BrowserRouter>
          <Routes>
            {/* Root Dispatch */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public/Authentication */}
            <Route path="/login" element={<LoginPage />} />

            {/* Public Monitor (Standalone Fullscreen without Drawer) */}
            <Route
              path="/monitor"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'LAVADOR', 'MAQUINA']}>
                  <MonitorPublicoPage />
                </RoleGuard>
              }
            />

            {/* Main Application Routes (Protected inside dynamic layout) */}
            <Route element={<MainLayoutWrapper />}>
              {/* Admin Dashboard */}
              <Route
                path="/resumen"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <ResumenPage />
                  </RoleGuard>
                }
              />

              {/* Turn Creation (Admin and Kiosk) */}
              <Route
                path="/turnos/nuevo"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'MAQUINA']}>
                    <NuevoTurnoPage />
                  </RoleGuard>
                }
              />

              {/* FIFO Queue (Admin, Kiosk, Lavador) */}
              <Route
                path="/turnos/cola"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'MAQUINA', 'LAVADOR']}>
                    <ColaEsperaPage />
                  </RoleGuard>
                }
              />

              {/* Stations (Admin and Lavador) */}
              <Route
                path="/estaciones"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'LAVADOR']}>
                    <EstacionesPage />
                  </RoleGuard>
                }
              />

              {/* History (Admin only) */}
              <Route
                path="/historial"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <HistorialPage />
                  </RoleGuard>
                }
              />

              {/* Clients CRUD (Admin only) */}
              <Route
                path="/admin/clientes"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <ClientesPage />
                  </RoleGuard>
                }
              />

              {/* Users CRUD (Admin only) */}
              <Route
                path="/admin/usuarios"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <UsuariosPage />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </CarWashProvider>
    </AuthProvider>
  );
}
