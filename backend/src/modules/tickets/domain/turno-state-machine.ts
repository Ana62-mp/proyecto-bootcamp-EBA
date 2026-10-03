import { EstadoTurno } from './types/ticket.types';

/**
 * Máquina de estados del turno:
 * EN_ESPERA → LAVANDO (despacho automático) → SECANDO_PULIENDO → LISTO → ENTREGADO.
 * EN_ESPERA → CANCELADO.
 */
export function siguienteEstadoAlAvanzar(estado: EstadoTurno): EstadoTurno | null {
  switch (estado) {
    case 'LAVANDO':
      return 'SECANDO_PULIENDO';
    case 'SECANDO_PULIENDO':
      return 'LISTO';
    default:
      return null;
  }
}

export const puedeEntregarse = (estado: EstadoTurno): boolean => estado === 'LISTO';
export const puedeCancelarse = (estado: EstadoTurno): boolean => estado === 'EN_ESPERA';

/** Número de turno legible: CW-YYYYMMDD-0001. */
export function formatNumeroTurno(fechaTurno: string, secuencia: number): string {
  return `CW-${fechaTurno.replace(/-/g, '')}-${String(secuencia).padStart(4, '0')}`;
}
