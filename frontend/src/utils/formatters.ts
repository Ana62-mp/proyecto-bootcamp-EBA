/**
 * Formatting helpers for currency, dates, labels, and badges
 */
import { EstadoTurno, TipoDocumento, TipoVehiculo, TipoLavado, Rol } from '../types';

export const currencyFormatter = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export function getElapsedTime(fromIsoString: string | null | undefined): string {
  if (!fromIsoString) return '0 min';
  const start = new Date(fromIsoString).getTime();
  const now = Date.now();
  const diffMinutes = Math.max(0, Math.floor((now - start) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hours}h ${mins}m`;
}

export const ESTADO_TURNO_CONFIG: Record<
  EstadoTurno,
  { label: string; bgClass: string; textClass: string; borderClass: string; desc: string }
> = {
  EN_ESPERA: {
    label: 'En espera',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    desc: 'En cola FIFO para ser asignado'
  },
  LAVANDO: {
    label: 'Lavando',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-200',
    desc: 'Limpieza con hidrolavadora y espuma activa'
  },
  SECANDO_PULIENDO: {
    label: 'Secado y pulido',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200',
    desc: 'Secado de microfibra, aspirado y acabado'
  },
  LISTO: {
    label: 'Listo para retiro',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    desc: 'Vehículo listo en zona de parqueadero'
  },
  ENTREGADO: {
    label: 'Entregado',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-200',
    desc: 'Servicio finalizado y entregado al cliente'
  },
  CANCELADO: {
    label: 'Cancelado',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-200',
    desc: 'Turno cancelado por administración'
  }
};

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  CEDULA: 'Cédula de Identidad',
  PASAPORTE: 'Pasaporte Internacional',
  RUC: 'RUC'
};

export const TIPO_VEHICULO_LABELS: Record<TipoVehiculo, string> = {
  AUTOMOVIL: 'Automóvil / Sedán',
  SUV: 'SUV / Crossover',
  CAMIONETA: 'Camioneta / Pick-Up',
  OTRO: 'Otro / Especial'
};

export const TIPO_LAVADO_LABELS: Record<TipoLavado, string> = {
  LAVADO_SIMPLE: 'Lavado simple',
  LAVADO_COMPLETO: 'Lavado completo',
  LAVADO_TAPICERIA: 'Lavado + tapicería',
  PARAFINADO: 'Parafinado protector'
};

export const ROL_LABELS: Record<Rol, string> = {
  ADMIN: 'Administrador',
  MAQUINA: 'Máquina Autoservicio',
  LAVADOR: 'Operador Lavador'
};
