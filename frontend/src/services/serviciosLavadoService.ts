/**
 * ServiciosLavadoService
 * Manages car wash service offerings and prices
 */
import { ServicioLavado } from '../types';
import { StorageService } from './storage';

export const ServiciosLavadoService = {
  async listar(): Promise<ServicioLavado[]> {
    return StorageService.getServicios();
  },

  async listarActivos(): Promise<ServicioLavado[]> {
    const list = StorageService.getServicios();
    return list.filter(s => s.activo);
  },

  async obtenerPorId(idServicio: number): Promise<ServicioLavado | null> {
    const list = StorageService.getServicios();
    return list.find(s => s.idServicio === idServicio) || null;
  }
};
