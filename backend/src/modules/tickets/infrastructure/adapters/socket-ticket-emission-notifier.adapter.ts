import { Injectable } from '@nestjs/common';
import { TicketsEmisionGateway } from '../../api/gateways/tickets-emision.gateway';
import type { TicketEmissionNotifierPort } from '../../domain/interfaces/ticket-emission-notifier.port';
import { TicketEmitidoEvent } from '../../domain/types/ticket-comprobante.types';

@Injectable()
export class SocketTicketEmissionNotifierAdapter implements TicketEmissionNotifierPort {
  constructor(private readonly gateway: TicketsEmisionGateway) {}

  notifyTicketEmitido(machineId: string, event: TicketEmitidoEvent): void {
    this.gateway.emitTicketEmitido(machineId, event);
  }
}
