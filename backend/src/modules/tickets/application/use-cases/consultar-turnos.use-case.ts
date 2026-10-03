import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { Paginated } from '../../../../common/interfaces/paginated.interface';
import { TICKET_REPOSITORY } from '../../domain/interfaces/ticket-repository.port';
import type { TicketRepositoryPort } from '../../domain/interfaces/ticket-repository.port';
import { TicketFilters, TicketRecord } from '../../domain/types/ticket.types';

@Injectable()
export class ListarTurnosUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort) {}

  execute(
    filters: TicketFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<TicketRecord>> {
    return this.tickets.list(filters, page, pageSize);
  }
}

@Injectable()
export class ColaActivaUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort) {}

  /** Turnos EN_ESPERA, LAVANDO, SECANDO_PULIENDO y LISTO en orden FIFO. */
  execute(): Promise<TicketRecord[]> {
    return this.tickets.listActive();
  }
}

@Injectable()
export class ObtenerTurnoUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort) {}

  async execute(id: string): Promise<TicketRecord> {
    const turno = await this.tickets.findById(id);
    if (!turno) throw AppException.notFound('TURNO_NO_ENCONTRADO', 'Turno no encontrado.');
    return turno;
  }
}

/** Comprobante para reimpresión: una máquina solo accede a los tickets emitidos para ella. */
@Injectable()
export class ObtenerTicketUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort) {}

  async execute(id: string, actor: AuthenticatedUser): Promise<TicketRecord> {
    const ticket = await this.tickets.findById(id);
    if (!ticket || (actor.rol === 'MAQUINA' && ticket.machineId !== actor.id)) {
      throw AppException.notFound('TICKET_NO_ENCONTRADO', 'Ticket no encontrado.');
    }
    return ticket;
  }
}
