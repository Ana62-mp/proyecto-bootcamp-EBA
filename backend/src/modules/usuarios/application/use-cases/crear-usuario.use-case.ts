import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { HASHER_PORT } from '../../domain/interfaces/hasher.port';
import type { HasherPort } from '../../domain/interfaces/hasher.port';
import { USUARIO_REPOSITORY } from '../../domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../domain/interfaces/usuario-repository.port';
import { NumeroEstacion, UsuarioRecord } from '../../domain/types/usuario.types';

export interface CrearUsuarioCommand {
  usuario: string;
  nombreVisible: string;
  rol: 'MAQUINA' | 'LAVADOR';
  passwordTemporal: string;
  codigo?: string | null;
  ubicacion?: string | null;
  estacionPreferida?: NumeroEstacion | null;
}

/** Crea máquinas o lavadores. El administrador único no se crea por API. */
@Injectable()
export class CrearUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(HASHER_PORT) private readonly hasher: HasherPort,
  ) {}

  async execute(cmd: CrearUsuarioCommand): Promise<UsuarioRecord> {
    if ((cmd.rol as string) === 'ADMIN') {
      throw AppException.forbidden(
        'ADMIN_UNICO',
        'No está permitido crear más de un administrador en el sistema.',
      );
    }
    const usuario = cmd.usuario.trim().toLowerCase();
    if (await this.usuarios.existsByUsuario(usuario)) {
      throw AppException.conflict(
        'USUARIO_DUPLICADO',
        `El nombre de usuario "${usuario}" ya está en uso.`,
      );
    }

    return this.usuarios.create({
      usuario,
      nombreVisible: cmd.nombreVisible.trim(),
      rol: cmd.rol,
      passwordHash: await this.hasher.hash(cmd.passwordTemporal),
      codigo: cmd.codigo?.trim() || null,
      ubicacion: cmd.rol === 'MAQUINA' ? cmd.ubicacion?.trim() || null : null,
      estacionPreferida: cmd.rol === 'LAVADOR' ? (cmd.estacionPreferida ?? null) : null,
    });
  }
}
