/**
 * Toast Notification Component
 * Displays clean floating alerts on completed operations.
 * Uses Lucide vector icons exclusively (no emojis).
 */
import React from 'react';
import { useCarWash } from '../../context/CarWashContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useCarWash();

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#3BBCFD] shrink-0" />
  };

  const styleMap = {
    success: 'bg-white border-emerald-300 text-slate-800 shadow-emerald-500/10',
    error: 'bg-white border-rose-300 text-slate-800 shadow-rose-500/10',
    warning: 'bg-white border-amber-300 text-slate-800 shadow-amber-500/10',
    info: 'bg-white border-sky-300 text-slate-800 shadow-sky-500/10'
  };

  const borderAccent = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-[#3BBCFD]'
  };

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-[calc(100%-40px)] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300 print:hidden">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border-2 shadow-xl ${styleMap[toast.type]} relative overflow-hidden`}
        role="status"
        aria-live="polite"
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${borderAccent[toast.type]}`} />
        
        <div className="ml-1 mt-0.5">{iconMap[toast.type]}</div>

        <div className="flex-1 text-xs font-semibold leading-relaxed pr-2">
          {toast.message}
        </div>

        <button
          type="button"
          onClick={clearToast}
          aria-label="Cerrar notificación"
          className="text-slate-400 hover:text-slate-700 p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
