import { ServicioRecord } from '../types/servicio.types';

export const SERVICIO_REPOSITORY = Symbol('SERVICIO_REPOSITORY');

export interface ServicioRepositoryPort {
  list(soloActivos: boolean): Promise<ServicioRecord[]>;
  findById(id: string): Promise<ServicioRecord | null>;
}
