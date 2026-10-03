import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { USUARIO_REPOSITORY } from '../../domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../domain/interfaces/usuario-repository.port';
import { UsuarioRecord } from '../../domain/types/usuario.types';

/** Desactivación lógica; el refresh siguiente del usuario desactivado será rechazado. */
@Injectable()
export class CambiarEstadoUsuarioUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort) {}

  async execute(id: string, activo: boolean): Promise<UsuarioRecord> {
    const current = await this.usuarios.findById(id);
    if (!current) throw AppException.notFound('USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.');
    if (current.rol === 'ADMIN' && !activo) {
      throw AppException.forbidden(
        'ADMIN_UNICO',
        'El Administrador Principal no puede ser desactivado.',
      );
    }
    return this.usuarios.update(id, { activo });
  }
}
