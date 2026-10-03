/**
 * UsuariosService implementation
 * Enforces single-admin protection, logical deletion, password resets, and user creation.
 */
import { PaginatedResult, Rol, Usuario } from '../types';
import { StorageService } from './storage';

export interface UsuarioFilters {
  searchTerm?: string;
  rol?: Rol | 'TODOS';
  activo?: boolean | 'TODOS';
}

export interface CrearUsuarioInput {
  usuario: string;
  nombreVisible: string;
  rol: 'MAQUINA' | 'LAVADOR'; // Admin creation prohibited!
  passwordTemporal: string;
  codigo?: string;
  ubicacion?: string;
  estacionPreferida?: 1 | 2 | null;
}

export const UsuariosService = {
  async listar(): Promise<Usuario[]> {
    return StorageService.getUsuarios();
  },

  async listarPaginado(
    filtros: UsuarioFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResult<Usuario>> {
    const usuarios = StorageService.getUsuarios();
    const term = (filtros.searchTerm || '').trim().toLowerCase();

    const filtered = usuarios.filter(u => {
      if (filtros.rol && filtros.rol !== 'TODOS') {
        if (u.rol !== filtros.rol) return false;
      }

      if (filtros.activo !== undefined && filtros.activo !== 'TODOS') {
        if (u.activo !== filtros.activo) return false;
      }

      if (term) {
        const matchUser = u.usuario.toLowerCase().includes(term);
        const matchNombre = u.nombreVisible.toLowerCase().includes(term);
        const matchCodigo = (u.codigo || '').toLowerCase().includes(term);
        const matchUbicacion = (u.ubicacion || '').toLowerCase().includes(term);

        if (!matchUser && !matchNombre && !matchCodigo && !matchUbicacion) {
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

  async crearUsuario(input: CrearUsuarioInput): Promise<Usuario> {
    if ((input.rol as string) === 'ADMIN') {
      throw new Error('No está permitido crear más de un administrador en el sistema.');
    }

    const usuarios = StorageService.getUsuarios();
    const username = input.usuario.trim().toLowerCase();

    if (!username) {
      throw new Error('El nombre de usuario es obligatorio.');
    }

    if (usuarios.some(u => u.usuario.toLowerCase() === username)) {
      throw new Error(`El nombre de usuario "${username}" ya está en uso.`);
    }

    const nextId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.idUsuario)) + 1 : 10;

    const nuevoUsuario: Usuario = {
      idUsuario: nextId,
      usuario: username,
      nombreVisible: input.nombreVisible.trim(),
      rol: input.rol,
      activo: true,
      codigo: input.codigo?.trim(),
      ubicacion: input.ubicacion?.trim(),
      estacionPreferida: input.estacionPreferida ?? null,
      passwordHash: input.passwordTemporal // Stored for simulated authentication
    };

    const updated = [...usuarios, nuevoUsuario];
    StorageService.saveUsuarios(updated);
    return nuevoUsuario;
  },

  async actualizarUsuario(
    idUsuario: number,
    datos: Partial<Omit<Usuario, 'idUsuario' | 'rol'>> & { rol?: Rol }
  ): Promise<Usuario> {
    const usuarios = StorageService.getUsuarios();
    const index = usuarios.findIndex(u => u.idUsuario === idUsuario);
    if (index === -1) {
      throw new Error('Usuario no encontrado.');
    }

    const current = usuarios[index];

    // Single-admin rule: cannot change admin role or demote admin
    if (current.rol === 'ADMIN' && datos.rol && datos.rol !== 'ADMIN') {
      throw new Error('No se puede cambiar el rol del Administrador Principal.');
    }
    if (current.rol !== 'ADMIN' && datos.rol === 'ADMIN') {
      throw new Error('No se puede promover otro usuario a Administrador.');
    }

    // Username uniqueness check if changed
    if (datos.usuario && datos.usuario.toLowerCase() !== current.usuario.toLowerCase()) {
      const username = datos.usuario.trim().toLowerCase();
      if (usuarios.some(u => u.idUsuario !== idUsuario && u.usuario.toLowerCase() === username)) {
        throw new Error(`El nombre de usuario "${username}" ya está en uso.`);
      }
    }

    const updatedUsuario: Usuario = {
      ...current,
      ...datos,
      usuario: (datos.usuario || current.usuario).trim().toLowerCase()
    };

    usuarios[index] = updatedUsuario;
    StorageService.saveUsuarios(usuarios);
    return updatedUsuario;
  },

  async cambiarEstadoActivo(idUsuario: number, activo: boolean): Promise<Usuario> {
    const usuarios = StorageService.getUsuarios();
    const index = usuarios.findIndex(u => u.idUsuario === idUsuario);
    if (index === -1) {
      throw new Error('Usuario no encontrado.');
    }

    const current = usuarios[index];
    if (current.rol === 'ADMIN' && !activo) {
      throw new Error('El Administrador Principal no puede ser desactivado.');
    }

    const updatedUsuario: Usuario = {
      ...current,
      activo
    };

    usuarios[index] = updatedUsuario;
    StorageService.saveUsuarios(usuarios);
    return updatedUsuario;
  },

  async restablecerPassword(idUsuario: number, nuevoPasswordTemporal: string): Promise<void> {
    const usuarios = StorageService.getUsuarios();
    const index = usuarios.findIndex(u => u.idUsuario === idUsuario);
    if (index === -1) {
      throw new Error('Usuario no encontrado.');
    }

    usuarios[index].passwordHash = nuevoPasswordTemporal;
    StorageService.saveUsuarios(usuarios);
  }
};
