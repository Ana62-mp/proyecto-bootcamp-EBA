/**
 * TopBar Component
 * Displays operational counters (synced with the backend), public monitor launcher, refresh button and profile badge.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCarWash } from '../../context/CarWashContext';
import {
  Menu,
  Tv,
  RefreshCw,
  Clock,
  Droplets,
  CheckCircle2,
  User
} from 'lucide-react';

interface TopBarProps {
  onOpenMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const { currentUser } = useAuth();
  const {
    turnosEnEspera,
    turnosEnProceso,
    turnosListos,
    turnos,
    refreshData
  } = useCarWash();

  // Counters
  const countEspera = turnosEnEspera.length;
  const countProceso = turnosEnProceso.length;
  const countListos = turnosListos.length;
  const countTotal = turnos.length;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        {/* Left: Mobile Toggle & Page Context */}
        <div className="flex items-center gap-3">
          {currentUser?.rol !== 'MAQUINA' && onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Abrir menú de navegación"
              className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Operational Metrics Strip */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1 scrollbar-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">En espera:</span>
              <span className="font-mono font-bold">{countEspera}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800">
              <Droplets className="w-3.5 h-3.5 text-[#3BBCFD] shrink-0" />
              <span className="hidden sm:inline">En proceso:</span>
              <span className="font-mono font-bold">{countProceso}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Listos:</span>
              <span className="font-mono font-bold">{countListos}</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
              <span>Total turnos:</span>
              <span className="font-mono font-bold text-slate-900">{countTotal}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Public Monitor Link */}
          <Link
            to="/monitor"
            title="Abrir pantalla pública en monitor o TV"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Tv className="w-4 h-4 text-[#3BBCFD]" />
            <span className="hidden sm:inline">Pantalla pública</span>
          </Link>

          {/* Recargar datos desde el servidor */}
          <button
            type="button"
            onClick={refreshData}
            title="Actualizar datos desde el servidor"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-sky-50 hover:border-sky-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Actualizar</span>
          </button>

          {/* User Badge */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#042544] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {currentUser?.nombreVisible?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {currentUser?.nombreVisible}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {currentUser?.rol}
              </p>
            </div>
          </div>
        </div>
      </header>

    </>
  );
};
