/**
 * TurnosService: emisión de tickets y operación de turnos contra el backend.
 * El despacho FIFO a estaciones y la máquina de estados se ejecutan en el servidor.
 */
import { CrearTurnoInput, Rol, TurnoCarwash } from '../types';
import { apiRequest } from './api';
import {
  mapTicket,
  mapTurno,
  mapTurnoPublico,
  TicketDto,
  TurnoDto,
  TurnoPublicoDto
} from './mappers';

export interface EmitirTicketResult {
  turno: TurnoCarwash;
  dispatched: boolean;
  replayed: boolean;
}

export const TurnosService = {
  /** Turnos activos: vista completa para ADMIN/LAVADOR, vista pública (sin datos personales) para MAQUINA. */
  async listarActivos(rol: Rol): Promise<TurnoCarwash[]> {
    if (rol === 'MAQUINA') {
      const { data } = await apiRequest<{ data: TurnoPublicoDto[] }>('/turnos/cola');
      return data.map(mapTurnoPublico);
    }
    const { data } = await apiRequest<{ data: TurnoDto[] }>('/turnos/activos');
    return data.map(mapTurno);
  },

  /** Últimos turnos entregados o cancelados (solo ADMIN). */
  async listarHistorial(pageSize = 100): Promise<TurnoCarwash[]> {
    const { data } = await apiRequest<{ data: TurnoDto[] }>('/turnos', {
      query: { estado: ['ENTREGADO', 'CANCELADO'], pageSize }
    });
    return data.map(mapTurno);
  },

  /**
   * Emite el ticket. `idempotencyKey` debe generarse una vez por operación y reutilizarse en
   * los reintentos: así un reintento devuelve el mismo ticket en lugar de crear otro.
   */
  async emitirTicket(input: CrearTurnoInput, idempotencyKey: string): Promise<EmitirTicketResult> {
    const { data, meta } = await apiRequest<{ data: TicketDto; meta: { replayed: boolean } }>(
      '/tickets/emision',
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: {
          clienteId: input.idCliente,
          vehiculoId: input.idVehiculo,
          servicioLavadoId: input.idServicio,
          ...(input.machineId ? { machineId: input.machineId } : {})
        }
      }
    );
    const turno = mapTicket(data);
    return { turno, dispatched: turno.estado === 'LAVANDO', replayed: meta.replayed };
  },

  async avanzarEstado(
    idTurno: string
  ): Promise<{ turno: TurnoCarwash; siguienteAsignado?: TurnoCarwash }> {
    const { data, meta } = await apiRequest<{ data: TurnoDto; meta: { asignados: TurnoDto[] } }>(
      `/turnos/${idTurno}/avanzar`,
      { method: 'POST' }
    );
    const siguiente = meta.asignados[0];
    return { turno: mapTurno(data), siguienteAsignado: siguiente ? mapTurno(siguiente) : undefined };
  },

  async entregarTurno(idTurno: string): Promise<TurnoCarwash> {
    const { data } = await apiRequest<{ data: TurnoDto }>(`/turnos/${idTurno}/entregar`, {
      method: 'POST'
    });
    return mapTurno(data);
  },

  async cancelarTurno(idTurno: string): Promise<TurnoCarwash> {
    const { data } = await apiRequest<{ data: TurnoDto }>(`/turnos/${idTurno}/cancelar`, {
      method: 'POST'
    });
    return mapTurno(data);
  },

  async asignarTurnosPendientes(): Promise<TurnoCarwash[]> {
    const { data } = await apiRequest<{ data: TurnoDto[] }>('/turnos/asignar-pendientes', {
      method: 'POST'
    });
    return data.map(mapTurno);
  }
};
