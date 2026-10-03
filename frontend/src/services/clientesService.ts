/**
 * ClientesService: clientes y vehículos persistidos en el backend (PostgreSQL).
 */
import { Cliente, PaginatedResult, TipoDocumento, TipoVehiculo, Vehiculo } from '../types';
import { apiRequest } from './api';
import { ClienteDto, mapCliente, mapVehiculo, PageMeta, VehiculoDto } from './mappers';

export interface ClienteFilters {
  searchTerm?: string;
  tipoDocumento?: TipoDocumento | 'TODOS';
  activo?: boolean | 'TODOS';
  fechaDesde?: string;
  fechaHasta?: string;
}

interface VehiculoInput {
  idVehiculo?: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipoVehiculo: TipoVehiculo;
  activo?: boolean;
}

type ClienteInput = Omit<Cliente, 'idCliente' | 'fechaRegistro' | 'fechaActualizacion' | 'vehiculos'> & {
  vehiculos?: VehiculoInput[];
};

function clienteBody(data: Partial<ClienteInput>) {
  return {
    tipoDocumento: data.tipoDocumento,
    numeroDocumento: data.numeroDocumento?.trim(),
    nombres: data.nombres,
    apellidos: data.apellidos,
    razonSocial: data.razonSocial,
    nombreContacto: data.nombreContacto,
    telefono: data.telefono,
    correo: data.correo
  };
}

async function registrarVehiculo(idCliente: string, v: VehiculoInput): Promise<Vehiculo> {
  const { data } = await apiRequest<{ data: VehiculoDto }>('/vehicles', {
    method: 'POST',
    body: {
      clienteId: idCliente,
      placa: v.placa,
      tipoVehiculo: v.tipoVehiculo,
      marca: v.marca.trim(),
      modelo: v.modelo.trim(),
      color: v.color.trim()
    }
  });
  return mapVehiculo(data);
}

export const ClientesService = {
  /** null = documento válido sin cliente registrado (cliente nuevo). */
  async buscarPorDocumento(tipo: TipoDocumento, numero: string): Promise<Cliente | null> {
    const { data } = await apiRequest<{ data: ClienteDto | null }>('/clientes/buscar', {
      query: { tipoDocumento: tipo, numeroDocumento: numero.trim() }
    });
    return data ? mapCliente(data) : null;
  },

  async obtenerPorId(idCliente: string): Promise<Cliente | null> {
    const { data } = await apiRequest<{ data: ClienteDto }>(`/clientes/${idCliente}`);
    return mapCliente(data);
  },

  async listarPaginado(
    filtros: ClienteFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResult<Cliente>> {
    const { data, meta } = await apiRequest<{ data: ClienteDto[]; meta: PageMeta }>('/clientes', {
      query: {
        page,
        pageSize,
        searchTerm: filtros.searchTerm?.trim(),
        tipoDocumento: filtros.tipoDocumento === 'TODOS' ? undefined : filtros.tipoDocumento,
        activo: filtros.activo === 'TODOS' ? undefined : filtros.activo,
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta
      }
    });
    return { items: data.map(mapCliente), ...meta };
  },

  /** Crea el cliente y, si se enviaron, registra sus vehículos asociados. */
  async crearCliente(clienteData: ClienteInput): Promise<Cliente> {
    const { data } = await apiRequest<{ data: ClienteDto }>('/clientes', {
      method: 'POST',
      body: clienteBody(clienteData)
    });
    for (const v of clienteData.vehiculos ?? []) {
      if (v.activo === false) continue;
      await registrarVehiculo(data.id, v);
    }
    return (await this.obtenerPorId(data.id)) ?? mapCliente(data);
  },

  /** Actualiza datos del cliente y sincroniza la lista de vehículos (altas, ediciones y bajas). */
  async actualizarCliente(idCliente: string, datos: Partial<ClienteInput>): Promise<Cliente> {
    await apiRequest(`/clientes/${idCliente}`, { method: 'PATCH', body: clienteBody(datos) });

    for (const v of datos.vehiculos ?? []) {
      if (v.idVehiculo) {
        await apiRequest(`/vehicles/${v.idVehiculo}`, {
          method: 'PATCH',
          body: {
            marca: v.marca,
            modelo: v.modelo,
            color: v.color,
            tipoVehiculo: v.tipoVehiculo,
            activo: v.activo ?? true
          }
        });
      } else if (v.activo !== false) {
        await registrarVehiculo(idCliente, v);
      }
    }
    return (await this.obtenerPorId(idCliente))!;
  },

  async cambiarEstadoActivo(idCliente: string, activo: boolean): Promise<Cliente> {
    const { data } = await apiRequest<{ data: ClienteDto }>(`/clientes/${idCliente}/estado`, {
      method: 'PATCH',
      body: { activo }
    });
    return mapCliente(data);
  },

  /** Registra (o reactiva, si ya era suyo) un vehículo del cliente. */
  async agregarVehiculo(
    idCliente: string,
    vehiculo: Omit<Vehiculo, 'idVehiculo' | 'idCliente'>
  ): Promise<Vehiculo> {
    return registrarVehiculo(idCliente, vehiculo);
  }
};
