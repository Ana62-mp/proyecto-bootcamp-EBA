/**
 * KioskLayout Component
 * Purpose-built for self-service machines (MAQUINA).
 * Features:
 * - Always-expanded desktop sidebar (never collapses)
 * - Fixed top bar on mobile/tablet (never hamburger)
 * - 60s inactivity auto-reset timer with 15s warning modal
 * - Zero personal data leaks
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { InactivityWarningModal } from '../common/InactivityWarningModal';
import { PlusCircle, ListOrdered, LogOut, ShieldAlert } from 'lucide-react';

const INACTIVITY_TIMEOUT_MS = 60000; // 60 seconds
const WARNING_COUNTDOWN_SEC = 15;

export const KioskLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_COUNTDOWN_SEC);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset inactivity timer on any user touch/click/keypress
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setShowWarning(false);
    setSecondsRemaining(WARNING_COUNTDOWN_SEC);

    // Set timer to trigger warning 15 seconds before full timeout
    timeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(WARNING_COUNTDOWN_SEC);

      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            // Full timeout reached: Reset kiosk session and navigate back to /turnos/nuevo
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setShowWarning(false);
            navigate('/turnos/nuevo', { replace: true });
            return WARNING_COUNTDOWN_SEC;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - WARNING_COUNTDOWN_SEC * 1000);
  }, [navigate]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetTimer();

    events.forEach(e => window.addEventListener(e, handleActivity));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [resetTimer, location.pathname]);

  const handleContinue = () => {
    resetTimer();
  };

  const handleResetNow = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setShowWarning(false);
    navigate('/turnos/nuevo', { replace: true });
  };

  const handleExitKiosk = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#ECECEA] overflow-hidden select-none">
      {/* Desktop Fixed Sidebar: ALWAYS EXPANDED (w-64), never collapsed, no hover dependency */}
      <aside className="hidden md:flex w-64 h-full bg-[#042544] text-white flex-col justify-between border-r border-[#08335c] shrink-0 z-30">
        <div>
          {/* Header & Logo */}
          <div className="h-24 p-3 border-b border-[#08335c] flex items-center justify-center">
            <Logo size="md" />
          </div>

          {/* Kiosk Mode Marker */}
          <div className="px-5 py-3 bg-[#031d36] text-[11px] text-[#BFC3CC] flex items-center justify-between">
            <span>Terminal Autoservicio</span>
            <span className="font-mono text-[#3BBCFD] font-bold">
              {currentUser?.codigo || 'KIOSK'}
            </span>
          </div>

          {/* Navigation Links: Exactly 2 options */}
          <nav className="p-4 space-y-2">
            <NavLink
              to="/turnos/nuevo"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-[#3BBCFD] text-[#042544] shadow-md'
                    : 'text-[#BFC3CC] hover:bg-[#073663] hover:text-white'
                }`
              }
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              <span>Nuevo turno</span>
            </NavLink>

            <NavLink
              to="/turnos/cola"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-[#3BBCFD] text-[#042544] shadow-md'
                    : 'text-[#BFC3CC] hover:bg-[#073663] hover:text-white'
                }`
              }
            >
              <ListOrdered className="w-5 h-5 shrink-0" />
              <span>Cola de espera</span>
            </NavLink>
          </nav>
        </div>

        {/* Footer with Exit Button for authorized personnel */}
        <div className="p-4 border-t border-[#08335c]">
          <button
            type="button"
            onClick={handleExitKiosk}
            className="w-full py-2.5 px-3 rounded-lg border border-[#08335c] hover:bg-[#073663] text-xs font-semibold text-[#BFC3CC] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir de terminal</span>
          </button>
        </div>
      </aside>

      {/* Tablet & Mobile: Fixed Top Navigation Bar (Spec Section 5.3: NO hamburger menu!) */}
      <header className="md:hidden bg-[#042544] text-white px-4 py-3 flex items-center justify-between border-b border-[#08335c] shrink-0 z-30">
        <Logo size="sm" showSubtitle={false} />

        <div className="flex items-center gap-2">
          <NavLink
            to="/turnos/nuevo"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isActive
                  ? 'bg-[#3BBCFD] text-[#042544]'
                  : 'text-[#BFC3CC] bg-[#063057]'
              }`
            }
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo turno</span>
          </NavLink>

          <NavLink
            to="/turnos/cola"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isActive
                  ? 'bg-[#3BBCFD] text-[#042544]'
                  : 'text-[#BFC3CC] bg-[#063057]'
              }`
            }
          >
            <ListOrdered className="w-4 h-4" />
            <span>Cola</span>
          </NavLink>

          <button
            type="button"
            onClick={handleExitKiosk}
            aria-label="Salir de terminal"
            className="p-2 text-[#BFC3CC] hover:text-white"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col">
        <Outlet />
      </main>

      {/* Privacy Inactivity Warning Modal */}
      <InactivityWarningModal
        isOpen={showWarning}
        secondsRemaining={secondsRemaining}
        onContinue={handleContinue}
        onReset={handleResetNow}
      />
    </div>
  );
};
