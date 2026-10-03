/**
 * Conversión entre los DTOs del backend y los tipos que usan los componentes.
 * El backend guarda la placa sin guion (PBH4321); en pantalla se muestra con guion (PBH-4321).
 */
import {
  Cliente,
  EstadoTurno,
  HistorialEstado,
  ServicioLavado,
  TipoDocumento,
  TipoLavado,
  TipoVehiculo,
  TurnoCarwash,
  Usuario,
  Vehiculo
} from '../types';
import { UsuarioDto } from './api';

export function formatPlaca(canonical: string): string {
  return canonical.replace(/^([A-Z]{2,3})-?(\d{3,4})$/, '$1-$2');
}

// ---------- DTOs ----------

export interface VehiculoDto {
  id: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipoVehiculo: TipoVehiculo;
  activo: boolean;
}

export interface ClienteDto {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string | null;
  apellidos: string | null;
  razonSocial: string | null;
  nombreContacto: string | null;
  telefono: string;
  correo: string | null;
  activo: boolean;
  vehiculos: VehiculoDto[];
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface ServicioDto {
  id: string;
  codigo: TipoLavado;
  nombre: string;
  descripcion: string;
  precio: string;
  moneda: string;
  activo: boolean;
}

interface TurnoClienteDto {
  id: string;
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
}

interface TurnoVehiculoDto {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipoVehiculo: TipoVehiculo;
}

export interface TurnoDto {
  id: string;
  numeroTurno: string;
  emitidoEn: string;
  estadoTurno: EstadoTurno;
  numeroEstacion: 1 | 2 | null;
  precio: string;
  cliente: TurnoClienteDto;
  vehiculo: TurnoVehiculoDto;
  servicio: { id: string; nombre: string; precio: string };
  lavador: { id: string; nombre: string } | null;
  fechaInicioLavado: string | null;
  fechaFinalizacion: string | null;
  fechaEntrega: string | null;
  historial: Array<{ estado: EstadoTurno; fecha: string; usuarioId: string | null }>;
}

export interface TurnoPublicoDto {
  id: string;
  numeroTurno: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  servicioNombre: string;
  estadoTurno: EstadoTurno;
  numeroEstacion: 1 | 2 | null;
  emitidoEn: string;
  fechaInicioLavado: string | null;
  fechaFinalizacion: string | null;
}

export interface TicketDto {
  ticketId: string;
  numeroTurno: string;
  emitidoEn: string;
  estado: 'EMITIDO' | 'ANULADO';
  estadoTurno: EstadoTurno;
  numeroEstacion: 1 | 2 | null;
  cliente: TurnoClienteDto;
  vehiculo: TurnoVehiculoDto;
  servicio: { id: string; nombre: string; precio: string; moneda: string };
  mensaje: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// ---------- Mapeos ----------

export function mapUsuario(dto: UsuarioDto): Usuario {
  return {
    idUsuario: dto.id,
    usuario: dto.usuario,
    nombreVisible: dto.nombreVisible,
    rol: dto.rol,
    activo: dto.activo,
    codigo: dto.codigo ?? undefined,
    ubicacion: dto.ubicacion ?? undefined,
    estacionPreferida: dto.estacionPreferida
  };
}

export function mapVehiculo(dto: VehiculoDto): Vehiculo {
  return {
    idVehiculo: dto.id,
    idCliente: dto.clienteId,
    placa: formatPlaca(dto.placa),
    marca: dto.marca,
    modelo: dto.modelo,
    color: dto.color,
    tipoVehiculo: dto.tipoVehiculo,
    activo: dto.activo
  };
}

export function mapCliente(dto: ClienteDto): Cliente {
  return {
    idCliente: dto.id,
    tipoDocumento: dto.tipoDocumento,
    numeroDocumento: dto.numeroDocumento,
    nombres: dto.nombres,
    apellidos: dto.apellidos,
    razonSocial: dto.razonSocial,
    nombreContacto: dto.nombreContacto,
    telefono: dto.telefono,
    correo: dto.correo,
    activo: dto.activo,
    vehiculos: dto.vehiculos.map(mapVehiculo),
    fechaRegistro: dto.fechaRegistro,
    fechaActualizacion: dto.fechaActualizacion
  };
}

export function mapServicio(dto: ServicioDto): ServicioLavado {
  return {
    idServicio: dto.id,
    codigo: dto.codigo,
    nombre: dto.nombre,
    descripcion: dto.descripcion,
    precio: Number(dto.precio),
    activo: dto.activo
  };
}

export function mapTurno(dto: TurnoDto): TurnoCarwash {
  const historialEstados: HistorialEstado[] = dto.historial.map(h => ({
    estado: h.estado,
    fecha: h.fecha,
    idUsuario: h.usuarioId
  }));
  return {
    idTurno: dto.id,
    numeroTurno: dto.numeroTurno,
    idCliente: dto.cliente.id,
    idVehiculo: dto.vehiculo.id,
    idServicio: dto.servicio.id,
    precioServicio: Number(dto.precio),
    fechaIngreso: dto.emitidoEn,
    estado: dto.estadoTurno,
    numeroEstacion: dto.numeroEstacion,
    idUsuarioAsignado: dto.lavador?.id ?? null,
    nombreLavador: dto.lavador?.nombre ?? null,
    fechaInicioLavado: dto.fechaInicioLavado,
    fechaFinalizacion: dto.fechaFinalizacion,
    fechaEntrega: dto.fechaEntrega,
    historialEstados,
    cliente: {
      nombre: dto.cliente.nombre,
      tipoDocumento: dto.cliente.tipoDocumento,
      numeroDocumento: dto.cliente.numeroDocumento
    },
    vehiculo: {
      placa: formatPlaca(dto.vehiculo.placa),
      marca: dto.vehiculo.marca,
      modelo: dto.vehiculo.modelo,
      color: dto.vehiculo.color,
      tipoVehiculo: dto.vehiculo.tipoVehiculo
    },
    servicioNombre: dto.servicio.nombre
  };
}

/** Vista pública de la cola (máquinas): sin datos del cliente ni precio. */
export function mapTurnoPublico(dto: TurnoPublicoDto): TurnoCarwash {
  return {
    idTurno: dto.id,
    numeroTurno: dto.numeroTurno,
    idCliente: '',
    idVehiculo: `pub:${dto.id}`,
    idServicio: `pub:${dto.id}`,
    precioServicio: 0,
    fechaIngreso: dto.emitidoEn,
    estado: dto.estadoTurno,
    numeroEstacion: dto.numeroEstacion,
    idUsuarioAsignado: null,
    nombreLavador: null,
    fechaInicioLavado: dto.fechaInicioLavado,
    fechaFinalizacion: dto.fechaFinalizacion,
    fechaEntrega: null,
    historialEstados: [],
    cliente: null,
    vehiculo: {
      placa: formatPlaca(dto.placa),
      marca: dto.marca,
      modelo: dto.modelo,
      color: dto.color,
      tipoVehiculo: null
    },
    servicioNombre: dto.servicioNombre
  };
}

/** Comprobante devuelto al emitir un ticket. */
export function mapTicket(dto: TicketDto): TurnoCarwash {
  return {
    idTurno: dto.ticketId,
    numeroTurno: dto.numeroTurno,
    idCliente: dto.cliente.id,
    idVehiculo: dto.vehiculo.id,
    idServicio: dto.servicio.id,
    precioServicio: Number(dto.servicio.precio),
    fechaIngreso: dto.emitidoEn,
    estado: dto.estadoTurno,
    numeroEstacion: dto.numeroEstacion,
    idUsuarioAsignado: null,
    nombreLavador: null,
    fechaInicioLavado: null,
    fechaFinalizacion: null,
    fechaEntrega: null,
    historialEstados: [],
    cliente: {
      nombre: dto.cliente.nombre,
      tipoDocumento: dto.cliente.tipoDocumento,
      numeroDocumento: dto.cliente.numeroDocumento
    },
    vehiculo: {
      placa: formatPlaca(dto.vehiculo.placa),
      marca: dto.vehiculo.marca,
      modelo: dto.vehiculo.modelo,
      color: dto.vehiculo.color,
      tipoVehiculo: dto.vehiculo.tipoVehiculo
    },
    servicioNombre: dto.servicio.nombre
  };
}
