/**
 * Central FIFO Dispatcher for Car Wash Stations
 * Automatically assigns queued EN_ESPERA vehicles to available stations (Estación 1 & 2).
 */
import { TurnoCarwash } from '../types';

export interface DispatchResult {
  updatedTurnos: TurnoCarwash[];
  assignedEvents: Array<{
    idTurno: number;
    numeroEstacion: 1 | 2;
  }>;
}

export const TurnAssignmentService = {
  /**
   * Evaluates the current state of stations and assigns FIFO pending vehicles
   */
  dispatchNextPending(turnos: TurnoCarwash[], idUsuarioDispatcher: number | null = null): DispatchResult {
    const list = [...turnos];
    const assignedEvents: Array<{ idTurno: number; numeroEstacion: 1 | 2 }> = [];

    // Active stations are those where a vehicle is currently in LAVANDO or SECANDO_PULIENDO
    // Note: Vehicles in LISTO have finished and cleared the station to the parking lot!
    const occupiedStations = new Set<number>();

    for (const t of list) {
      if ((t.estado === 'LAVANDO' || t.estado === 'SECANDO_PULIENDO') && t.numeroEstacion) {
        occupiedStations.add(t.numeroEstacion);
      }
    }

    const availableStations: Array<1 | 2> = [];
    if (!occupiedStations.has(1)) availableStations.push(1);
    if (!occupiedStations.has(2)) availableStations.push(2);

    if (availableStations.length === 0) {
      return { updatedTurnos: list, assignedEvents };
    }

    // Get all EN_ESPERA turns sorted by FIFO: fechaIngreso ASC, then idTurno ASC
    const pendingIndices = list
      .map((t, idx) => ({ t, idx }))
      .filter(({ t }) => t.estado === 'EN_ESPERA')
      .sort((a, b) => {
        const timeDiff = new Date(a.t.fechaIngreso).getTime() - new Date(b.t.fechaIngreso).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.t.idTurno - b.t.idTurno;
      });

    const nowIso = new Date().toISOString();

    for (const stationNumber of availableStations) {
      if (pendingIndices.length === 0) break;
      const nextPending = pendingIndices.shift()!;
      const originalTurno = list[nextPending.idx];

      const updatedTurno: TurnoCarwash = {
        ...originalTurno,
        estado: 'LAVANDO',
        numeroEstacion: stationNumber,
        fechaInicioLavado: nowIso,
        idUsuarioAsignado: idUsuarioDispatcher ?? originalTurno.idUsuarioAsignado,
        historialEstados: [
          ...originalTurno.historialEstados,
          {
            estado: 'LAVANDO',
            fecha: nowIso,
            idUsuario: idUsuarioDispatcher
          }
        ]
      };

      list[nextPending.idx] = updatedTurno;
      assignedEvents.push({ idTurno: originalTurno.idTurno, numeroEstacion: stationNumber });
    }

    return {
      updatedTurnos: list,
      assignedEvents
    };
  }
};
