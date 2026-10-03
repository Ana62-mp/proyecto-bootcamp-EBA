/**
 * Kiosk Inactivity Warning Modal
 * Protects customer privacy by auto-resetting the kiosk after 60s of inactivity.
 */
import React, { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onContinue: () => void;
  onReset: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  secondsRemaining,
  onContinue,
  onReset
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white rounded-2xl p-6 text-center shadow-2xl border border-amber-200">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 animate-bounce" />
        </div>

        <h3 className="text-xl font-bold text-[#042544] mb-2">
          ¿Sigues ahí?
        </h3>

        <p className="text-sm text-slate-600 mb-4">
          Por seguridad y protección de tus datos personales, la pantalla se reiniciará automáticamente en:
        </p>

        <div className="text-4xl font-black font-mono text-amber-600 mb-6 py-2 px-4 bg-amber-50 rounded-xl inline-block border border-amber-200">
          00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 py-3 px-4 rounded-xl bg-[#042544] hover:bg-[#063560] text-white font-bold transition-colors text-sm"
          >
            Continuar aquí
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors text-sm flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Reiniciar ahora
          </button>
        </div>
      </div>
    </div>
  );
};
