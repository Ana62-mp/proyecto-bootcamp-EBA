import { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';

export type EstadoTurno =
  'EN_ESPERA' | 'LAVANDO' | 'SECANDO_PULIENDO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export type TipoDocumento = 'CEDULA' | 'PASAPORTE' | 'RUC';
export type TipoVehiculo = 'AUTOMOVIL' | 'SUV' | 'CAMIONETA' | 'OTRO';
export type NumeroEstacion = 1 | 2;

export const ESTACIONES: readonly NumeroEstacion[] = [1, 2];
export const ESTADOS_ACTIVOS: readonly EstadoTurno[] = [
  'EN_ESPERA',
  'LAVANDO',
  'SECANDO_PULIENDO',
  'LISTO',
];
export const ESTADOS_EN_ESTACION: readonly EstadoTurno[] = ['LAVANDO', 'SECANDO_PULIENDO'];

export interface HistorialEstadoRecord {
  estado: EstadoTurno;
  fecha: Date;
  usuarioId: string | null;
}

export interface TicketRecord {
  id: string;
  numeroTurno: string;
  emitidoEn: Date;
  machineId: string;
  emitidoPorId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  clienteId: string;
  vehiculoId: string;
  servicioId: string;
  precio: string;
  moneda: string;
  servicioNombre: string;
  clienteNombre: string;
  clienteTipoDocumento: TipoDocumento;
  clienteNumeroDocumento: string;
  vehiculoPlaca: string;
  vehiculoMarca: string;
  vehiculoModelo: string;
  vehiculoColor: string;
  vehiculoTipo: TipoVehiculo;
  estadoTurno: EstadoTurno;
  numeroEstacion: NumeroEstacion | null;
  lavadorId: string | null;
  lavadorNombre: string | null;
  fechaInicioLavado: Date | null;
  fechaFinalizacion: Date | null;
  fechaEntrega: Date | null;
  historial: HistorialEstadoRecord[];
}

export interface NewTicketData {
  numeroTurno: string;
  fechaTurno: string;
  secuencia: number;
  emitidoEn: Date;
  clienteId: string;
  vehiculoId: string;
  servicioId: string;
  emitidoPorId: string;
  machineId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  precio: string;
  moneda: string;
  servicioNombre: string;
  clienteNombre: string;
  clienteTipoDocumento: TipoDocumento;
  clienteNumeroDocumento: string;
  vehiculoPlaca: string;
  vehiculoMarca: string;
  vehiculoModelo: string;
  vehiculoColor: string;
  vehiculoTipo: TipoVehiculo;
}

export interface TurnoChanges {
  estadoTurno: EstadoTurno;
  numeroEstacion?: NumeroEstacion | null;
  lavadorId?: string | null;
  fechaInicioLavado?: Date;
  fechaFinalizacion?: Date;
  fechaEntrega?: Date;
}

export interface ClienteParaTicket {
  id: string;
  activo: boolean;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string | null;
  apellidos: string | null;
  razonSocial: string | null;
}

export interface VehiculoParaTicket {
  id: string;
  clienteId: string;
  activo: boolean;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipoVehiculo: TipoVehiculo;
}

export interface ServicioParaTicket {
  id: string;
  activo: boolean;
  nombre: string;
  precio: string;
  moneda: string;
}

export interface TicketFilters {
  estados?: EstadoTurno[];
  /** YYYY-MM-DD inclusive en America/Guayaquil. */
  fechaDesde?: string;
  fechaHasta?: string;
  searchTerm?: string;
}

export interface EmitirTicketCommand {
  actor: AuthenticatedUser;
  idempotencyKey: string;
  clienteId: string;
  vehiculoId: string;
  servicioLavadoId: string;
  /** Solo para ADMIN: máquina destino. Una máquina usa siempre su propia identidad. */
  machineId?: string;
}

/** Ya existe un ticket con la misma (actor, Idempotency-Key). */
export class DuplicateIdempotencyKeyError extends Error {
  constructor() {
    super('Idempotency-Key duplicada');
    this.name = 'DuplicateIdempotencyKeyError';
  }
}
