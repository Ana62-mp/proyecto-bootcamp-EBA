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
  idUsuario: number;
  usuario: string;
  nombreVisible: string;
  rol: Rol;
  activo: boolean;
  codigo?: string;
  ubicacion?: string;
  estacionPreferida?: 1 | 2 | null;
  // Deterministic mock password (only used in simulated auth)
  passwordHash?: string;
}

export interface Vehiculo {
  idVehiculo: number;
  idCliente: number;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipoVehiculo: TipoVehiculo;
  activo: boolean;
}

export interface Cliente {
  idCliente: number;
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
  idServicio: number;
  codigo: TipoLavado;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
}

export interface HistorialEstado {
  estado: EstadoTurno;
  fecha: string;
  idUsuario: number | null;
}

export interface TurnoCarwash {
  idTurno: number;
  idCliente: number;
  idVehiculo: number;
  idServicio: number;
  precioServicio: number;
  fechaIngreso: string;
  estado: EstadoTurno;
  numeroEstacion: 1 | 2 | null;
  idUsuarioAsignado: number | null;
  fechaInicioLavado: string | null;
  fechaFinalizacion: string | null;
  fechaEntrega: string | null;
  historialEstados: HistorialEstado[];
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CrearTurnoInput {
  idCliente: number;
  idVehiculo: number;
  idServicio: number;
  idUsuarioCreador?: number;
}

export type EventoTurno =
  | 'TURNO_CREADO'
  | 'TURNO_ASIGNADO'
  | 'ESTADO_ACTUALIZADO'
  | 'VEHICULO_LISTO'
  | 'TURNO_ENTREGADO'
  | 'TURNO_CANCELADO';
