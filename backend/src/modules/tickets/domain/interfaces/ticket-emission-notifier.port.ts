import { TicketEmitidoEvent } from '../types/ticket-comprobante.types';

export const TICKET_EMISSION_NOTIFIER = Symbol('TICKET_EMISSION_NOTIFIER');

/** Notifica la emisión de un ticket a la room de su máquina. Sin garantía de entrega. */
export interface TicketEmissionNotifierPort {
  notifyTicketEmitido(machineId: string, event: TicketEmitidoEvent): void;
}
