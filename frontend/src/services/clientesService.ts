/**
 * ClientesService implementation
 * Handles CRUD, logical deactivation, search with filters, vehicle management, and turn validations.
 */
import {
  Cliente,
  PaginatedResult,
  TipoDocumento,
  Vehiculo
} from '../types';
import { StorageService } from './storage';

export interface ClienteFilters {
  searchTerm?: string;
  tipoDocumento?: TipoDocumento | 'TODOS';
  activo?: boolean | 'TODOS';
  fechaDesde?: string;
  fechaHasta?: string;
}

export const ClientesService = {
  async buscarPorDocumento(tipo: TipoDocumento, numero: string): Promise<Cliente | null> {
    const clientes = StorageService.getClientes();
    const cleanedNumber = numero.trim();
    const cliente = clientes.find(
      c => c.tipoDocumento === tipo && c.numeroDocumento === cleanedNumber
    );
    return cliente || null;
  },

  async obtenerPorId(idCliente: number): Promise<Cliente | null> {
    const clientes = StorageService.getClientes();
    return clientes.find(c => c.idCliente === idCliente) || null;
  },

  async listarPaginado(
    filtros: ClienteFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResult<Cliente>> {
    const clientes = StorageService.getClientes();
    const term = (filtros.searchTerm || '').trim().toLowerCase();

    const filtered = clientes.filter(c => {
      // Document type filter
      if (filtros.tipoDocumento && filtros.tipoDocumento !== 'TODOS') {
        if (c.tipoDocumento !== filtros.tipoDocumento) return false;
      }

      // Active status filter
      if (filtros.activo !== undefined && filtros.activo !== 'TODOS') {
        if (c.activo !== filtros.activo) return false;
      }

      // Date range filters
      if (filtros.fechaDesde) {
        if (new Date(c.fechaRegistro) < new Date(filtros.fechaDesde)) return false;
      }
      if (filtros.fechaHasta) {
        const hastaEnd = new Date(filtros.fechaHasta);
        hastaEnd.setHours(23, 59, 59, 999);
        if (new Date(c.fechaRegistro) > hastaEnd) return false;
      }

      // Free text search across document number, names, company, phone, and vehicle plates
      if (term) {
        const matchesDoc = c.numeroDocumento.toLowerCase().includes(term);
        const matchesNombre = `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().includes(term);
        const matchesRazon = (c.razonSocial || '').toLowerCase().includes(term);
        const matchesContacto = (c.nombreContacto || '').toLowerCase().includes(term);
        const matchesTel = c.telefono.toLowerCase().includes(term);
        const matchesPlaca = c.vehiculos.some(v => v.placa.toLowerCase().includes(term));

        if (!matchesDoc && !matchesNombre && !matchesRazon && !matchesContacto && !matchesTel && !matchesPlaca) {
          return false;
        }
      }

      return true;
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      page: safePage,
      pageSize,
      totalItems,
      totalPages
    };
  },

  async crearCliente(clienteData: Omit<Cliente, 'idCliente' | 'fechaRegistro' | 'fechaActualizacion'>): Promise<Cliente> {
    const clientes = StorageService.getClientes();

    // Check duplicate document
    const exists = clientes.some(
      c => c.tipoDocumento === clienteData.tipoDocumento && c.numeroDocumento === clienteData.numeroDocumento.trim()
    );
    if (exists) {
      throw new Error(`Ya existe un cliente registrado con ${clienteData.tipoDocumento} ${clienteData.numeroDocumento}.`);
    }

    const nextId = clientes.length > 0 ? Math.max(...clientes.map(c => c.idCliente)) + 1 : 1;
    const nowIso = new Date().toISOString();

    const nuevoCliente: Cliente = {
      ...clienteData,
      idCliente: nextId,
      numeroDocumento: clienteData.numeroDocumento.trim(),
      fechaRegistro: nowIso,
      fechaActualizacion: nowIso,
      vehiculos: clienteData.vehiculos.map((v, i) => ({
        ...v,
        idVehiculo: 1000 + nextId * 10 + i,
        idCliente: nextId,
        activo: true
      }))
    };

    const updated = [nuevoCliente, ...clientes];
    StorageService.saveClientes(updated);
    return nuevoCliente;
  },

  async actualizarCliente(
    idCliente: number,
    datos: Partial<Omit<Cliente, 'idCliente' | 'fechaRegistro'>>
  ): Promise<Cliente> {
    const clientes = StorageService.getClientes();
    const index = clientes.findIndex(c => c.idCliente === idCliente);
    if (index === -1) {
      throw new Error('Cliente no encontrado.');
    }

    const current = clientes[index];

    // If document is being modified, verify no collision with another customer
    if (datos.tipoDocumento || datos.numeroDocumento) {
      const targetType = datos.tipoDocumento || current.tipoDocumento;
      const targetNum = (datos.numeroDocumento || current.numeroDocumento).trim();
      const duplicate = clientes.find(
        c => c.idCliente !== idCliente && c.tipoDocumento === targetType && c.numeroDocumento === targetNum
      );
      if (duplicate) {
        throw new Error(`El documento ${targetNum} ya está registrado para otro cliente.`);
      }
    }

    const updatedCliente: Cliente = {
      ...current,
      ...datos,
      fechaActualizacion: new Date().toISOString()
    };

    clientes[index] = updatedCliente;
    StorageService.saveClientes(clientes);
    return updatedCliente;
  },

  async cambiarEstadoActivo(idCliente: number, activo: boolean): Promise<Cliente> {
    const clientes = StorageService.getClientes();
    const index = clientes.findIndex(c => c.idCliente === idCliente);
    if (index === -1) {
      throw new Error('Cliente no encontrado.');
    }

    // Constraint: cannot deactivate customer with an active turn
    if (!activo) {
      const turnos = StorageService.getTurnos();
      const activeStates = ['EN_ESPERA', 'LAVANDO', 'SECANDO_PULIENDO', 'LISTO'];
      const hasActiveTurn = turnos.some(
        t => t.idCliente === idCliente && activeStates.includes(t.estado)
      );
      if (hasActiveTurn) {
        throw new Error('No se puede desactivar este cliente porque tiene un turno activo en el sistema.');
      }
    }

    const current = clientes[index];
    const updatedCliente: Cliente = {
      ...current,
      activo,
      fechaActualizacion: new Date().toISOString()
    };

    clientes[index] = updatedCliente;
    StorageService.saveClientes(clientes);
    return updatedCliente;
  },

  async agregarVehiculo(idCliente: number, vehiculo: Omit<Vehiculo, 'idVehiculo' | 'idCliente'>): Promise<Vehiculo> {
    const clientes = StorageService.getClientes();
    const index = clientes.findIndex(c => c.idCliente === idCliente);
    if (index === -1) {
      throw new Error('Cliente no encontrado.');
    }

    const placaNorm = vehiculo.placa.trim().toUpperCase();

    // Check if plate belongs to another client
    const otherClientWithPlate = clientes.find(
      c => c.idCliente !== idCliente && c.vehiculos.some(v => v.placa === placaNorm)
    );
    if (otherClientWithPlate) {
      throw new Error('Esta placa ya se encuentra registrada. Solicita asistencia al personal.');
    }

    const currentClient = clientes[index];
    // If client already has this vehicle, update or return it
    const existingIndex = currentClient.vehiculos.findIndex(v => v.placa === placaNorm);
    if (existingIndex >= 0) {
      // Re-activate if was inactive
      const v = currentClient.vehiculos[existingIndex];
      v.activo = true;
      v.marca = vehiculo.marca;
      v.modelo = vehiculo.modelo;
      v.color = vehiculo.color;
      v.tipoVehiculo = vehiculo.tipoVehiculo;
      StorageService.saveClientes(clientes);
      return v;
    }

    // Assign unique id
    let maxVehiculoId = 500;
    for (const c of clientes) {
      for (const v of c.vehiculos) {
        if (v.idVehiculo > maxVehiculoId) maxVehiculoId = v.idVehiculo;
      }
    }

    const nuevoVehiculo: Vehiculo = {
      ...vehiculo,
      idVehiculo: maxVehiculoId + 1,
      idCliente,
      placa: placaNorm,
      activo: true
    };

    currentClient.vehiculos.push(nuevoVehiculo);
    currentClient.fechaActualizacion = new Date().toISOString();
    StorageService.saveClientes(clientes);
    return nuevoVehiculo;
  }
};
