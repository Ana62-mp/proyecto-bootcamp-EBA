export type TipoDocumento = 'CEDULA' | 'PASAPORTE' | 'RUC';
export type TipoVehiculo = 'AUTOMOVIL' | 'SUV' | 'CAMIONETA' | 'OTRO';

export interface VehiculoResumen {
  id: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipoVehiculo: TipoVehiculo;
  activo: boolean;
}

export interface ClienteRecord {
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
  vehiculos: VehiculoResumen[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClienteFilters {
  searchTerm?: string;
  tipoDocumento?: TipoDocumento;
  activo?: boolean;
  /** YYYY-MM-DD, inclusive, en America/Guayaquil. */
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface ClienteData {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string | null;
  apellidos: string | null;
  razonSocial: string | null;
  nombreContacto: string | null;
  telefono: string;
  correo: string | null;
}

/** Nombre a mostrar en tickets y listados. */
export function nombreCliente(
  c: Pick<ClienteRecord, 'nombres' | 'apellidos' | 'razonSocial'>,
): string {
  if (c.razonSocial) return c.razonSocial;
  return [c.nombres, c.apellidos].filter(Boolean).join(' ').trim();
}
