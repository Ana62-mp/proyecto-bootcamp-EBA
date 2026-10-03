/**
 * Chip and Status Badge Component
 * Always combines color with descriptive text and subtle icons.
 */
import React from 'react';
import { EstadoTurno } from '../../types';
import { ESTADO_TURNO_CONFIG } from '../../utils/formatters';
import { Clock, Droplets, Sparkles, CheckCircle2, CheckSquare, XCircle } from 'lucide-react';

interface EstadoBadgeProps {
  estado: EstadoTurno;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const EstadoBadge: React.FC<EstadoBadgeProps> = ({
  estado,
  size = 'md',
  showIcon = true
}) => {
  const config = ESTADO_TURNO_CONFIG[estado] || {
    label: estado,
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200'
  };

  const icons: Record<EstadoTurno, React.ReactNode> = {
    EN_ESPERA: <Clock className="w-3.5 h-3.5 shrink-0" />,
    LAVANDO: <Droplets className="w-3.5 h-3.5 shrink-0 animate-pulse text-[#3BBCFD]" />,
    SECANDO_PULIENDO: <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-600" />,
    LISTO: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />,
    ENTREGADO: <CheckSquare className="w-3.5 h-3.5 shrink-0" />,
    CANCELADO: <XCircle className="w-3.5 h-3.5 shrink-0" />
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses} whitespace-nowrap`}
    >
      {showIcon && icons[estado]}
      <span>{config.label}</span>
    </span>
  );
};
