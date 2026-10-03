/**
 * ServiciosLavadoService: catálogo de servicios y precios desde el backend.
 */
import { ServicioLavado } from '../types';
import { apiRequest } from './api';
import { mapServicio, ServicioDto } from './mappers';

export const ServiciosLavadoService = {
  /** El backend solo incluye inactivos si el usuario es ADMIN. */
  async listar(incluirInactivos = false): Promise<ServicioLavado[]> {
    const { data } = await apiRequest<{ data: ServicioDto[] }>('/servicios', {
      query: { incluirInactivos }
    });
    return data.map(mapServicio);
  },

  async listarActivos(): Promise<ServicioLavado[]> {
    return (await this.listar(false)).filter(s => s.activo);
  }
};
