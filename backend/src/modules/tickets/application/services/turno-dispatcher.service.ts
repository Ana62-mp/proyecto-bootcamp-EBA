import { Injectable } from '@nestjs/common';
import type { TicketTransactionPort } from '../../domain/interfaces/ticket-repository.port';
import { ESTACIONES } from '../../domain/types/ticket.types';

/**
 * Despachador FIFO: asigna turnos EN_ESPERA a las estaciones libres (1 y 2).
 * Debe ejecutarse dentro de una transacción con lockTurnos() tomado.
 */
@Injectable()
export class TurnoDispatcherService {
  async dispatch(
    tx: TicketTransactionPort,
    usuarioId: string | null,
    now: Date,
  ): Promise<string[]> {
    const occupied = new Set(await tx.occupiedStations());
    const free = ESTACIONES.filter((station) => !occupied.has(station));
    if (free.length === 0) return [];

    const pending = await tx.pendingFifo(free.length);
    for (const [index, ticketId] of pending.entries()) {
      await tx.updateTurno(
        ticketId,
        { estadoTurno: 'LAVANDO', numeroEstacion: free[index], fechaInicioLavado: now },
        { estado: 'LAVANDO', fecha: now, usuarioId },
      );
    }
    return pending;
  }
}
