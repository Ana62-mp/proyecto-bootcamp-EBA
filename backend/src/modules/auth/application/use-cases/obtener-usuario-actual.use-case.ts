import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { USUARIO_REPOSITORY } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import { UsuarioRecord } from '../../../usuarios/domain/types/usuario.types';

@Injectable()
export class ObtenerUsuarioActualUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort) {}

  async execute(id: string): Promise<UsuarioRecord> {
    const user = await this.usuarios.findById(id);
    if (!user || !user.activo) {
      throw AppException.unauthorized('UNAUTHORIZED', 'Sesión inválida o expirada.');
    }
    return user;
  }
}
