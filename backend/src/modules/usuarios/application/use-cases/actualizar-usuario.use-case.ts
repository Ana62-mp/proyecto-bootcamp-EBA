import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { RolUsuario } from '../../../../common/interfaces/authenticated-user.interface';
import { USUARIO_REPOSITORY } from '../../domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../domain/interfaces/usuario-repository.port';
import {
  ActualizarUsuarioData,
  NumeroEstacion,
  UsuarioRecord,
} from '../../domain/types/usuario.types';

export interface ActualizarUsuarioCommand {
  usuario?: string;
  nombreVisible?: string;
  rol?: RolUsuario;
  codigo?: string | null;
  ubicacion?: string | null;
  estacionPreferida?: NumeroEstacion | null;
}

@Injectable()
export class ActualizarUsuarioUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort) {}

  async execute(id: string, cmd: ActualizarUsuarioCommand): Promise<UsuarioRecord> {
    const current = await this.usuarios.findById(id);
    if (!current) throw AppException.notFound('USUARIO_NO_ENCONTRADO', 'Usuario no encontrado.');

    if (current.rol === 'ADMIN' && cmd.rol && cmd.rol !== 'ADMIN') {
      throw AppException.forbidden(
        'ADMIN_UNICO',
        'No se puede cambiar el rol del Administrador Principal.',
      );
    }
    if (current.rol !== 'ADMIN' && cmd.rol === 'ADMIN') {
      throw AppException.forbidden(
        'ADMIN_UNICO',
        'No se puede promover otro usuario a Administrador.',
      );
    }

    const data: ActualizarUsuarioData = {};
    if (cmd.usuario !== undefined) {
      const usuario = cmd.usuario.trim().toLowerCase();
      if (await this.usuarios.existsByUsuario(usuario, id)) {
        throw AppException.conflict(
          'USUARIO_DUPLICADO',
          `El nombre de usuario "${usuario}" ya está en uso.`,
        );
      }
      data.usuario = usuario;
    }
    if (cmd.nombreVisible !== undefined) data.nombreVisible = cmd.nombreVisible.trim();
    if (cmd.rol !== undefined) data.rol = cmd.rol;
    if (cmd.codigo !== undefined) data.codigo = cmd.codigo?.trim() || null;

    const rolFinal = cmd.rol ?? current.rol;
    if (cmd.ubicacion !== undefined || rolFinal !== current.rol) {
      data.ubicacion =
        rolFinal === 'MAQUINA' ? (cmd.ubicacion ?? current.ubicacion)?.trim() || null : null;
    }
    if (cmd.estacionPreferida !== undefined || rolFinal !== current.rol) {
      data.estacionPreferida =
        rolFinal === 'LAVADOR' ? (cmd.estacionPreferida ?? current.estacionPreferida) : null;
    }

    return this.usuarios.update(id, data);
  }
}
