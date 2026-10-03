/**
 * TopBar Component
 * Displays real-time operational counters, public monitor launcher, demo reset button, and profile badge.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCarWash } from '../../context/CarWashContext';
import {
  Menu,
  Tv,
  RotateCcw,
  Clock,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  User
} from 'lucide-react';
import { Modal } from '../common/Modal';

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
    resetDemostracion
  } = useCarWash();
  const [showResetModal, setShowResetModal] = useState(false);

  const isAdmin = currentUser?.rol === 'ADMIN';

  // Counters
  const countEspera = turnosEnEspera.length;
  const countProceso = turnosEnProceso.length;
  const countListos = turnosListos.length;
  const countTotal = turnos.length;

  const handleConfirmReset = () => {
    resetDemostracion();
    setShowResetModal(false);
  };

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

          {/* Reset Demo Data (Admin Only per spec Section 3.1 & 21) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              title="Restablecer datos de demostración"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Restablecer demo</span>
            </button>
          )}

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

      {/* Confirmation Modal for Demo Data Reset */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Restablecer datos de demostración"
        description="Esta acción recargará todos los clientes, vehículos y turnos iniciales."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Se perderán los turnos o clientes creados durante esta sesión y el sistema regresará al estado inicial seed con dos estaciones configuradas y turnos de prueba.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
            >
              Sí, restablecer datos
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
