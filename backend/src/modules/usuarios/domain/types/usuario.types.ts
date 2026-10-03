import { RolUsuario } from '../../../../common/interfaces/authenticated-user.interface';

export type NumeroEstacion = 1 | 2;

export interface UsuarioRecord {
  id: string;
  usuario: string;
  nombreVisible: string;
  rol: RolUsuario;
  activo: boolean;
  codigo: string | null;
  ubicacion: string | null;
  estacionPreferida: NumeroEstacion | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsuarioConPassword extends UsuarioRecord {
  passwordHash: string;
}

export interface UsuarioFilters {
  searchTerm?: string;
  rol?: RolUsuario;
  activo?: boolean;
}

export interface CrearUsuarioData {
  usuario: string;
  nombreVisible: string;
  rol: Exclude<RolUsuario, 'ADMIN'>;
  passwordHash: string;
  codigo: string | null;
  ubicacion: string | null;
  estacionPreferida: NumeroEstacion | null;
}

export interface ActualizarUsuarioData {
  usuario?: string;
  nombreVisible?: string;
  rol?: RolUsuario;
  activo?: boolean;
  codigo?: string | null;
  ubicacion?: string | null;
  estacionPreferida?: NumeroEstacion | null;
}
