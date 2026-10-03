/**
 * TurnosService implementation
 * Wraps storage, triggers automatic station dispatching, and enforces state machine rules.
 */
import {
  TurnoCarwash,
  CrearTurnoInput,
  EstadoTurno,
  EventoTurno
} from '../types';
import { StorageService } from './storage';
import { TurnAssignmentService } from './turnAssignmentService';

export interface TurnosServiceListener {
  (evento: EventoTurno, payload: unknown): void;
}

const listeners: TurnosServiceListener[] = [];

export const TurnosService = {
  subscribe(listener: TurnosServiceListener): () => void {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },

  emit(evento: EventoTurno, payload: unknown): void {
    // TODO: When migrating to WebSockets, replace this local dispatcher with ws.send / event broker
    for (const listener of listeners) {
      try {
        listener(evento, payload);
      } catch (err) {
        console.error('Error in TurnosService listener', err);
      }
    }
  },

  async listarTurnos(): Promise<TurnoCarwash[]> {
    return StorageService.getTurnos();
  },

  async crearTurno(input: CrearTurnoInput): Promise<{ turno: TurnoCarwash; dispatched: boolean }> {
    const turnos = StorageService.getTurnos();
    const clientes = StorageService.getClientes();
    const servicios = StorageService.getServicios();

    // Verify vehicle does not already have an active turn
    const activeStates: EstadoTurno[] = ['EN_ESPERA', 'LAVANDO', 'SECANDO_PULIENDO', 'LISTO'];
    const activeTurnWithVehicle = turnos.find(
      t => t.idVehiculo === input.idVehiculo && activeStates.includes(t.estado)
    );
    if (activeTurnWithVehicle) {
      throw new Error('Este vehículo ya tiene un turno activo en el sistema.');
    }

    const cliente = clientes.find(c => c.idCliente === input.idCliente);
    if (!cliente) {
      throw new Error('El cliente seleccionado no existe.');
    }

    const servicio = servicios.find(s => s.idServicio === input.idServicio);
    if (!servicio || !servicio.activo) {
      throw new Error('El servicio seleccionado no está disponible.');
    }

    const nextId = turnos.length > 0 ? Math.max(...turnos.map(t => t.idTurno)) + 1 : 201;
    const nowIso = new Date().toISOString();

    const nuevoTurno: TurnoCarwash = {
      idTurno: nextId,
      idCliente: input.idCliente,
      idVehiculo: input.idVehiculo,
      idServicio: input.idServicio,
      precioServicio: servicio.precio, // Snapshot historical price
      fechaIngreso: nowIso,
      estado: 'EN_ESPERA',
      numeroEstacion: null,
      idUsuarioAsignado: null,
      fechaInicioLavado: null,
      fechaFinalizacion: null,
      fechaEntrega: null,
      historialEstados: [
        {
          estado: 'EN_ESPERA',
          fecha: nowIso,
          idUsuario: input.idUsuarioCreador ?? null
        }
      ]
    };

    const updatedList = [nuevoTurno, ...turnos];

    // Trigger automatic dispatcher to immediately assign if a station is free!
    const dispatchResult = TurnAssignmentService.dispatchNextPending(
      updatedList,
      input.idUsuarioCreador ?? null
    );

    StorageService.saveTurnos(dispatchResult.updatedTurnos);

    const resultingTurno = dispatchResult.updatedTurnos.find(t => t.idTurno === nextId) || nuevoTurno;
    const wasDispatched = resultingTurno.estado === 'LAVANDO';

    this.emit('TURNO_CREADO', resultingTurno);
    if (wasDispatched) {
      this.emit('TURNO_ASIGNADO', resultingTurno);
    }

    return { turno: resultingTurno, dispatched: wasDispatched };
  },

  async asignarTurnosPendientes(idUsuario: number | null = null): Promise<TurnoCarwash[]> {
    const turnos = StorageService.getTurnos();
    const result = TurnAssignmentService.dispatchNextPending(turnos, idUsuario);
    StorageService.saveTurnos(result.updatedTurnos);
    for (const ev of result.assignedEvents) {
      const assigned = result.updatedTurnos.find(t => t.idTurno === ev.idTurno);
      if (assigned) {
        this.emit('TURNO_ASIGNADO', assigned);
      }
    }
    return result.updatedTurnos;
  },

  async avanzarEstado(
    idTurno: number,
    idUsuario: number
  ): Promise<{
    turno: TurnoCarwash;
    siguienteAsignado?: TurnoCarwash;
    estacionLiberada: number | null;
  }> {
    let turnos = StorageService.getTurnos();
    const index = turnos.findIndex(t => t.idTurno === idTurno);
    if (index === -1) {
      throw new Error(`Turno con ID ${idTurno} no encontrado.`);
    }

    const currentTurno = turnos[index];
    const nowIso = new Date().toISOString();
    let siguienteEstado: EstadoTurno;
    let fechaInicioLavado = currentTurno.fechaInicioLavado;
    let fechaFinalizacion = currentTurno.fechaFinalizacion;
    let numeroEstacion = currentTurno.numeroEstacion;
    let estacionLiberada: number | null = null;

    if (currentTurno.estado === 'LAVANDO') {
      siguienteEstado = 'SECANDO_PULIENDO';
    } else if (currentTurno.estado === 'SECANDO_PULIENDO') {
      siguienteEstado = 'LISTO';
      fechaFinalizacion = nowIso;
      estacionLiberada = currentTurno.numeroEstacion;
      numeroEstacion = null; // Spec requirement: LISTO frees the station!
    } else {
      throw new Error(`No se puede avanzar el turno desde el estado ${currentTurno.estado}.`);
    }

    const updatedTurno: TurnoCarwash = {
      ...currentTurno,
      estado: siguienteEstado,
      numeroEstacion,
      fechaInicioLavado,
      fechaFinalizacion,
      historialEstados: [
        ...currentTurno.historialEstados,
        {
          estado: siguienteEstado,
          fecha: nowIso,
          idUsuario
        }
      ]
    };

    turnos[index] = updatedTurno;

    let siguienteAsignado: TurnoCarwash | undefined = undefined;

    // If moving to LISTO, station was freed, so execute dispatcher to assign the oldest queued vehicle!
    if (siguienteEstado === 'LISTO') {
      const dispatchResult = TurnAssignmentService.dispatchNextPending(turnos, idUsuario);
      turnos = dispatchResult.updatedTurnos;
      if (dispatchResult.assignedEvents.length > 0) {
        const nextId = dispatchResult.assignedEvents[0].idTurno;
        siguienteAsignado = turnos.find(t => t.idTurno === nextId);
        if (siguienteAsignado) {
          this.emit('TURNO_ASIGNADO', siguienteAsignado);
        }
      }
      this.emit('VEHICULO_LISTO', updatedTurno);
    } else {
      this.emit('ESTADO_ACTUALIZADO', updatedTurno);
    }

    StorageService.saveTurnos(turnos);

    return {
      turno: updatedTurno,
      siguienteAsignado,
      estacionLiberada
    };
  },

  async entregarTurno(idTurno: number, idUsuario: number): Promise<TurnoCarwash> {
    const turnos = StorageService.getTurnos();
    const index = turnos.findIndex(t => t.idTurno === idTurno);
    if (index === -1) {
      throw new Error(`Turno ${idTurno} no encontrado.`);
    }

    const currentTurno = turnos[index];
    if (currentTurno.estado !== 'LISTO') {
      throw new Error('Solo se pueden entregar vehículos que se encuentren en estado LISTO.');
    }

    const nowIso = new Date().toISOString();
    const updatedTurno: TurnoCarwash = {
      ...currentTurno,
      estado: 'ENTREGADO',
      fechaEntrega: nowIso,
      historialEstados: [
        ...currentTurno.historialEstados,
        {
          estado: 'ENTREGADO',
          fecha: nowIso,
          idUsuario
        }
      ]
    };

    turnos[index] = updatedTurno;
    StorageService.saveTurnos(turnos);
    this.emit('TURNO_ENTREGADO', updatedTurno);
    return updatedTurno;
  },

  async cancelarTurno(idTurno: number, idUsuario: number): Promise<TurnoCarwash> {
    let turnos = StorageService.getTurnos();
    const index = turnos.findIndex(t => t.idTurno === idTurno);
    if (index === -1) {
      throw new Error(`Turno ${idTurno} no encontrado.`);
    }

    const currentTurno = turnos[index];
    if (currentTurno.estado !== 'EN_ESPERA') {
      throw new Error('Solo se pueden cancelar turnos que estén En Espera.');
    }

    const nowIso = new Date().toISOString();
    const updatedTurno: TurnoCarwash = {
      ...currentTurno,
      estado: 'CANCELADO',
      historialEstados: [
        ...currentTurno.historialEstados,
        {
          estado: 'CANCELADO',
          fecha: nowIso,
          idUsuario
        }
      ]
    };

    turnos[index] = updatedTurno;

    // Spec rule: after cancellation, run dispatcher again
    const dispatchResult = TurnAssignmentService.dispatchNextPending(turnos, idUsuario);
    turnos = dispatchResult.updatedTurnos;

    StorageService.saveTurnos(turnos);
    this.emit('TURNO_CANCELADO', updatedTurno);

    return updatedTurno;
  }
};
