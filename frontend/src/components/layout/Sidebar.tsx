/**
 * Sidebar Navigation Component
 * Conforms strictly to specifications and dimensions:
 * - Admin & Lavador: Collapsible drawer (72px collapsed -> 256px on hover/focus), 200ms smooth transition, navy bg (#042544).
 * - Máquina: Always expanded (256px), never collapses, no hover dependency.
 * - Clean vertical alignment and spacing, no horizontal jitter or clipped text.
 */
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Layers,
  Tv,
  History,
  Users,
  UserCheck,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  setIsMobileOpen = () => {}
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const isMaquina = currentUser?.rol === 'MAQUINA';

  // Navigation items filtered by role
  const navItems = [
    {
      to: '/resumen',
      label: 'Resumen',
      icon: LayoutDashboard,
      roles: ['ADMIN']
    },
    {
      to: '/turnos/nuevo',
      label: 'Nuevo turno',
      icon: PlusCircle,
      roles: ['ADMIN', 'MAQUINA']
    },
    {
      to: '/turnos/cola',
      label: 'Cola de espera',
      icon: ListOrdered,
      roles: ['ADMIN', 'MAQUINA', 'LAVADOR']
    },
    {
      to: '/estaciones',
      label: 'Estaciones',
      icon: Layers,
      roles: ['ADMIN', 'LAVADOR']
    },
    {
      to: '/monitor',
      label: 'Pantalla pública',
      icon: Tv,
      roles: ['ADMIN', 'LAVADOR']
    },
    {
      to: '/historial',
      label: 'Historial',
      icon: History,
      roles: ['ADMIN']
    },
    {
      to: '/admin/clientes',
      label: 'Clientes',
      icon: Users,
      roles: ['ADMIN']
    },
    {
      to: '/admin/usuarios',
      label: 'Usuarios',
      icon: UserCheck,
      roles: ['ADMIN']
    }
  ].filter(item => (currentUser ? item.roles.includes(currentUser.rol) : false));

  // Determine expansion state
  const isExpanded = isMaquina || isHovered;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navContent = (
    <aside
      onMouseEnter={() => !isMaquina && setIsHovered(true)}
      onMouseLeave={() => !isMaquina && setIsHovered(false)}
      className={`h-screen bg-[#042544] text-white flex flex-col justify-between transition-all duration-200 ease-in-out border-r border-[#08335c] select-none ${
        isMaquina ? 'w-64' : isHovered ? 'w-64 shadow-2xl' : 'w-[72px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-24 px-3 flex items-center justify-center border-b border-[#08335c] overflow-hidden shrink-0">
        {isExpanded ? (
          <div className="flex items-center justify-center w-full px-2">
            <Logo size="md" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <Logo size="sm" />
          </div>
        )}
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3 py-3 rounded-xl text-xs font-bold transition-colors ${
                  isExpanded ? 'justify-start' : 'justify-center'
                } ${
                  isActive
                    ? 'bg-[#3BBCFD] text-[#042544] shadow-sm'
                    : 'text-[#BFC3CC] hover:bg-[#073663] hover:text-white'
                }`
              }
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isExpanded && (
                <span className="truncate whitespace-nowrap">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Status and Sign Out */}
      <div className="p-3 border-t border-[#08335c] shrink-0">
        {isExpanded ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#063057]/60">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {currentUser?.nombreVisible || 'Usuario'}
              </p>
              <p className="text-[10px] text-[#3BBCFD] font-mono uppercase tracking-wider truncate">
                {currentUser?.rol}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 text-[#BFC3CC] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 text-[#BFC3CC] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar: Sticky on viewport, fixed width placeholder */}
      <div
        className={`hidden md:block shrink-0 h-screen sticky top-0 z-40 transition-all duration-200 ${
          isMaquina ? 'w-64' : isHovered ? 'w-64' : 'w-[72px]'
        }`}
      >
        {navContent}
      </div>

      {/* Mobile / Tablet Overlay Drawer */}
      {!isMaquina && isMobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-64 h-full bg-[#042544] animate-in slide-in-from-left duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 flex justify-between items-center border-b border-[#08335c]">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="text-[#BFC3CC] hover:text-white p-1"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[calc(100%-80px)]">{navContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
