/**
 * UsuariosService: administración de usuarios contra el backend.
 * El backend aplica la regla de administrador único y la desactivación lógica.
 */
import { PaginatedResult, Rol, Usuario } from '../types';
import { apiRequest, UsuarioDto } from './api';
import { mapUsuario, PageMeta } from './mappers';

export interface UsuarioFilters {
  searchTerm?: string;
  rol?: Rol | 'TODOS';
  activo?: boolean | 'TODOS';
}

export interface CrearUsuarioInput {
  usuario: string;
  nombreVisible: string;
  rol: 'MAQUINA' | 'LAVADOR';
  passwordTemporal: string;
  codigo?: string;
  ubicacion?: string;
  estacionPreferida?: 1 | 2 | null;
}

export type ActualizarUsuarioInput = Partial<Omit<Usuario, 'idUsuario'>> & {
  passwordTemporal?: string;
};

export const UsuariosService = {
  async listarPaginado(
    filtros: UsuarioFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResult<Usuario>> {
    const { data, meta } = await apiRequest<{ data: UsuarioDto[]; meta: PageMeta }>('/usuarios', {
      query: {
        page,
        pageSize,
        searchTerm: filtros.searchTerm?.trim(),
        rol: filtros.rol === 'TODOS' ? undefined : filtros.rol,
        activo: filtros.activo === 'TODOS' ? undefined : filtros.activo
      }
    });
    return { items: data.map(mapUsuario), ...meta };
  },

  /** Máquinas (kioscos) activas: destino de los tickets que emite un administrador. */
  async listarMaquinasActivas(): Promise<Usuario[]> {
    const { data } = await apiRequest<{ data: UsuarioDto[] }>('/usuarios', {
      query: { rol: 'MAQUINA', activo: true, pageSize: 100 }
    });
    return data.map(mapUsuario);
  },

  async crearUsuario(input: CrearUsuarioInput): Promise<Usuario> {
    const { data } = await apiRequest<{ data: UsuarioDto }>('/usuarios', {
      method: 'POST',
      body: input
    });
    return mapUsuario(data);
  },

  async actualizarUsuario(idUsuario: string, datos: ActualizarUsuarioInput): Promise<Usuario> {
    const { data } = await apiRequest<{ data: UsuarioDto }>(`/usuarios/${idUsuario}`, {
      method: 'PATCH',
      body: {
        usuario: datos.usuario,
        nombreVisible: datos.nombreVisible,
        rol: datos.rol,
        codigo: datos.codigo,
        ubicacion: datos.ubicacion,
        estacionPreferida: datos.estacionPreferida
      }
    });
    if (datos.passwordTemporal) {
      await this.restablecerPassword(idUsuario, datos.passwordTemporal);
    }
    return mapUsuario(data);
  },

  async cambiarEstadoActivo(idUsuario: string, activo: boolean): Promise<Usuario> {
    const { data } = await apiRequest<{ data: UsuarioDto }>(`/usuarios/${idUsuario}/estado`, {
      method: 'PATCH',
      body: { activo }
    });
    return mapUsuario(data);
  },

  async restablecerPassword(idUsuario: string, nuevoPasswordTemporal: string): Promise<void> {
    await apiRequest(`/usuarios/${idUsuario}/restablecer-password`, {
      method: 'POST',
      body: { nuevoPasswordTemporal }
    });
  }
};
