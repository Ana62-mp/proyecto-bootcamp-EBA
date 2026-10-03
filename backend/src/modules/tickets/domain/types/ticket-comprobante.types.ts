import {
  EstadoTurno,
  NumeroEstacion,
  TicketRecord,
  TipoDocumento,
  TipoVehiculo,
} from './ticket.types';

export const MENSAJE_COMPROBANTE = 'Después de pagar, diríjase al parqueadero.';

/**
 * Contenido del comprobante: es exactamente `data` de POST /api/tickets/emision
 * y `ticket` del evento Socket.IO `ticket:emitido` (§11.4).
 */
export interface TicketComprobante {
  ticketId: string;
  numeroTurno: string;
  emitidoEn: string;
  /** Estado del comprobante; no implica pago. */
  estado: 'EMITIDO' | 'ANULADO';
  estadoPago: 'PENDIENTE';
  estadoTurno: EstadoTurno;
  numeroEstacion: NumeroEstacion | null;
  cliente: { id: string; nombre: string; tipoDocumento: TipoDocumento; numeroDocumento: string };
  vehiculo: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    color: string;
    tipoVehiculo: TipoVehiculo;
  };
  servicio: { id: string; nombre: string; precio: string; moneda: string };
  mensaje: string;
}

export function toComprobante(ticket: TicketRecord): TicketComprobante {
  return {
    ticketId: ticket.id,
    numeroTurno: ticket.numeroTurno,
    emitidoEn: ticket.emitidoEn.toISOString(),
    estado: ticket.estadoTurno === 'CANCELADO' ? 'ANULADO' : 'EMITIDO',
    estadoPago: 'PENDIENTE',
    estadoTurno: ticket.estadoTurno,
    numeroEstacion: ticket.numeroEstacion,
    cliente: {
      id: ticket.clienteId,
      nombre: ticket.clienteNombre,
      tipoDocumento: ticket.clienteTipoDocumento,
      numeroDocumento: ticket.clienteNumeroDocumento,
    },
    vehiculo: {
      id: ticket.vehiculoId,
      placa: ticket.vehiculoPlaca,
      marca: ticket.vehiculoMarca,
      modelo: ticket.vehiculoModelo,
      color: ticket.vehiculoColor,
      tipoVehiculo: ticket.vehiculoTipo,
    },
    servicio: {
      id: ticket.servicioId,
      nombre: ticket.servicioNombre,
      precio: ticket.precio,
      moneda: ticket.moneda,
    },
    mensaje: MENSAJE_COMPROBANTE,
  };
}

/** Payload del evento `ticket:emitido`. */
export interface TicketEmitidoEvent {
  eventId: string;
  /** Coincide con el header Idempotency-Key de la emisión. */
  requestId: string;
  occurredAt: string;
  ticket: TicketComprobante;
}
