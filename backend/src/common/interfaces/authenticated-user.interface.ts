export type RolUsuario = 'ADMIN' | 'MAQUINA' | 'LAVADOR';

/** Identidad derivada del access token validado. */
export interface AuthenticatedUser {
  id: string;
  usuario: string;
  rol: RolUsuario;
}
