import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { HASHER_PORT } from '../../domain/interfaces/hasher.port';
import type { HasherPort } from '../../domain/interfaces/hasher.port';
import { USUARIO_REPOSITORY } from '../../domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../domain/interfaces/usuario-repository.port';

@Injectable()
export class RestablecerPasswordUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(HASHER_PORT) private readonly hasher: HasherPort,
  ) {}

  async execute(id: string, nuevoPasswordTemporal: string): Promise<void> {
    const current = await this.usuarios.findById(id);
    if (!current) throw AppException.notFound('USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.');
    await this.usuarios.updatePassword(id, await this.hasher.hash(nuevoPasswordTemporal));
  }
}
