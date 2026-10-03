import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { TICKET_REPOSITORY } from '../../domain/interfaces/ticket-repository.port';
import type {
  TicketRepositoryPort,
  TicketTransactionPort,
} from '../../domain/interfaces/ticket-repository.port';
import { TicketRecord } from '../../domain/types/ticket.types';
import {
  puedeCancelarse,
  puedeEntregarse,
  siguienteEstadoAlAvanzar,
} from '../../domain/turno-state-machine';
import { TurnoDispatcherService } from '../services/turno-dispatcher.service';

export interface AvanzarTurnoResult {
  turno: TicketRecord;
  /** Turnos que pasaron a LAVANDO al liberarse una estación. */
  asignados: TicketRecord[];
}

async function loadOrFail(tx: TicketTransactionPort, id: string): Promise<TicketRecord> {
  const turno = await tx.findById(id);
  if (!turno) throw AppException.notFound('TURNO_NO_ENCONTRADO', 'Turno no encontrado.');
  return turno;
}

async function reload(tx: TicketTransactionPort, ids: string[]): Promise<TicketRecord[]> {
  const records = await Promise.all(ids.map((id) => tx.findById(id)));
  return records.filter((r): r is TicketRecord => r !== null);
}

/** Operaciones del turno por HTTP REST; no emiten eventos WebSocket (§11.5). */
@Injectable()
export class AvanzarTurnoUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    private readonly dispatcher: TurnoDispatcherService,
  ) {}

  execute(id: string, actor: AuthenticatedUser): Promise<AvanzarTurnoResult> {
    return this.tickets.runInTransaction(async (tx) => {
      await tx.lockTurnos();
      const turno = await loadOrFail(tx, id);
      const siguiente = siguienteEstadoAlAvanzar(turno.estadoTurno);
      if (!siguiente) {
        throw AppException.conflict(
          'TRANSICION_INVALIDA',
          `No se puede avanzar el turno desde el estado ${turno.estadoTurno}.`,
        );
      }

      const now = new Date();
      const lavadorId = turno.lavadorId ?? (actor.rol === 'LAVADOR' ? actor.id : null);
      if (siguiente === 'LISTO') {
        // LISTO libera la estación y se despacha el siguiente vehículo en cola.
        await tx.updateTurno(
          id,
          { estadoTurno: 'LISTO', numeroEstacion: null, fechaFinalizacion: now, lavadorId },
          { estado: 'LISTO', fecha: now, usuarioId: actor.id },
        );
        const asignados = await this.dispatcher.dispatch(tx, actor.id, now);
        return { turno: await loadOrFail(tx, id), asignados: await reload(tx, asignados) };
      }

      await tx.updateTurno(
        id,
        { estadoTurno: siguiente, lavadorId },
        { estado: siguiente, fecha: now, usuarioId: actor.id },
      );
      return { turno: await loadOrFail(tx, id), asignados: [] };
    });
  }
}

@Injectable()
export class EntregarTurnoUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort) {}

  execute(id: string, actor: AuthenticatedUser): Promise<TicketRecord> {
    return this.tickets.runInTransaction(async (tx) => {
      await tx.lockTurnos();
      const turno = await loadOrFail(tx, id);
      if (!puedeEntregarse(turno.estadoTurno)) {
        throw AppException.conflict(
          'TRANSICION_INVALIDA',
          'Solo se pueden entregar vehículos que se encuentren en estado LISTO.',
        );
      }
      const now = new Date();
      await tx.updateTurno(
        id,
        { estadoTurno: 'ENTREGADO', fechaEntrega: now },
        { estado: 'ENTREGADO', fecha: now, usuarioId: actor.id },
      );
      return loadOrFail(tx, id);
    });
  }
}

@Injectable()
export class CancelarTurnoUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    private readonly dispatcher: TurnoDispatcherService,
  ) {}

  execute(id: string, actor: AuthenticatedUser): Promise<TicketRecord> {
    return this.tickets.runInTransaction(async (tx) => {
      await tx.lockTurnos();
      const turno = await loadOrFail(tx, id);
      if (!puedeCancelarse(turno.estadoTurno)) {
        throw AppException.conflict(
          'TRANSICION_INVALIDA',
          'Solo se pueden cancelar turnos que estén En Espera.',
        );
      }
      const now = new Date();
      await tx.updateTurno(
        id,
        { estadoTurno: 'CANCELADO' },
        { estado: 'CANCELADO', fecha: now, usuarioId: actor.id },
      );
      await this.dispatcher.dispatch(tx, actor.id, now);
      return loadOrFail(tx, id);
    });
  }
}

@Injectable()
export class AsignarPendientesUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    private readonly dispatcher: TurnoDispatcherService,
  ) {}

  execute(actor: AuthenticatedUser): Promise<TicketRecord[]> {
    return this.tickets.runInTransaction(async (tx) => {
      await tx.lockTurnos();
      const asignados = await this.dispatcher.dispatch(tx, actor.id, new Date());
      return reload(tx, asignados);
    });
  }
}
