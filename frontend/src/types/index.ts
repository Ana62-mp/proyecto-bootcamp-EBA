/**
 * Core type definitions for Sistema de Turnos Car Wash
 * Conforming to Spec Maestro Definitivo
 */

export type Rol = 'ADMIN' | 'MAQUINA' | 'LAVADOR';
export type TipoDocumento = 'CEDULA' | 'PASAPORTE' | 'RUC';
export type TipoVehiculo = 'AUTOMOVIL' | 'SUV' | 'CAMIONETA' | 'OTRO';

export type EstadoTurno =
  | 'EN_ESPERA'
  | 'LAVANDO'
  | 'SECANDO_PULIENDO'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type TipoLavado =
  | 'LAVADO_SIMPLE'
  | 'LAVADO_COMPLETO'
  | 'LAVADO_TAPICERIA'
  | 'PARAFINADO';

export interface Usuario {
  idUsuario: string;
  usuario: string;
  nombreVisible: string;
  rol: Rol;
  activo: boolean;
  codigo?: string;
  ubicacion?: string;
  estacionPreferida?: 1 | 2 | null;
}

export interface Vehiculo {
  idVehiculo: string;
  idCliente: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipoVehiculo: TipoVehiculo;
  activo: boolean;
}

export interface Cliente {
  idCliente: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string | null;
  apellidos: string | null;
  razonSocial: string | null;
  nombreContacto: string | null;
  telefono: string;
  correo: string | null;
  activo: boolean;
  vehiculos: Vehiculo[];
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface ServicioLavado {
  idServicio: string;
  codigo: TipoLavado;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
}

export interface HistorialEstado {
  estado: EstadoTurno;
  fecha: string;
  idUsuario: string | null;
}

export interface TurnoCarwash {
  idTurno: string;
  idCliente: string;
  idVehiculo: string;
  idServicio: string;
  precioServicio: number;
  fechaIngreso: string;
  estado: EstadoTurno;
  numeroEstacion: 1 | 2 | null;
  idUsuarioAsignado: string | null;
  fechaInicioLavado: string | null;
  fechaFinalizacion: string | null;
  fechaEntrega: string | null;
  historialEstados: HistorialEstado[];
  /** Número legible del turno (CW-YYYYMMDD-NNNN). */
  numeroTurno: string;
  /** Copia del comprobante; cliente es null en la vista pública (kiosko y monitor). */
  cliente: TurnoClienteSnapshot | null;
  vehiculo: TurnoVehiculoSnapshot;
  servicioNombre: string;
  nombreLavador: string | null;
}

export interface TurnoClienteSnapshot {
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
}

export interface TurnoVehiculoSnapshot {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipoVehiculo: TipoVehiculo | null;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CrearTurnoInput {
  idCliente: string;
  idVehiculo: string;
  idServicio: string;
  /** Solo ADMIN: máquina (kiosko) destino del ticket. */
  machineId?: string;
}

export type EventoTurno =
  | 'TURNO_CREADO'
  | 'TURNO_ASIGNADO'
  | 'ESTADO_ACTUALIZADO'
  | 'VEHICULO_LISTO'
  | 'TURNO_ENTREGADO'
  | 'TURNO_CANCELADO';
