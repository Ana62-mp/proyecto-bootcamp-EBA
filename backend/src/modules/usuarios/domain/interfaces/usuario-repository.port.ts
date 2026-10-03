import { Paginated } from '../../../../common/interfaces/paginated.interface';
import {
  ActualizarUsuarioData,
  CrearUsuarioData,
  UsuarioConPassword,
  UsuarioFilters,
  UsuarioRecord,
} from '../types/usuario.types';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface UsuarioRepositoryPort {
  findById(id: string): Promise<UsuarioRecord | null>;
  findByUsuarioWithPassword(usuario: string): Promise<UsuarioConPassword | null>;
  existsByUsuario(usuario: string, excludeId?: string): Promise<boolean>;
  list(filters: UsuarioFilters, page: number, pageSize: number): Promise<Paginated<UsuarioRecord>>;
  /** Lanza conflicto si el nombre de usuario ya existe. */
  create(data: CrearUsuarioData): Promise<UsuarioRecord>;
  update(id: string, data: ActualizarUsuarioData): Promise<UsuarioRecord>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
