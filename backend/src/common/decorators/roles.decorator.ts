import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../interfaces/authenticated-user.interface';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
