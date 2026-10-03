import { Inject, Injectable } from '@nestjs/common';
import { TokenVerifierService } from '../../../auth/application/services/token-verifier.service';
import { USUARIO_REPOSITORY } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../../usuarios/domain/interfaces/usuario-repository.port';

export interface EmissionChannelIdentity {
  userId: string;
  machineId: string;
  /** Instante (ms) en que expira el access token; el socket se desconecta entonces. */
  expiresAt: number;
}

export type ChannelAuthErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'MACHINE_NOT_AUTHORIZED';

export class ChannelAuthError extends Error {
  constructor(readonly code: ChannelAuthErrorCode) {
    super(code);
    this.name = 'ChannelAuthError';
  }
}

/**
 * Autentica el handshake de /tickets-emision antes de unir el socket a una room:
 * access token válido, usuario activo en base de datos y máquina destino derivada de datos confiables.
 */
@Injectable()
export class EmissionChannelAuthService {
  constructor(
    private readonly verifier: TokenVerifierService,
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
  ) {}

  async authenticate(
    token: unknown,
    requestedMachineId: unknown,
  ): Promise<EmissionChannelIdentity> {
    if (typeof token !== 'string' || token.length === 0) throw new ChannelAuthError('UNAUTHORIZED');

    let payload;
    try {
      payload = this.verifier.verify(token, 'access');
    } catch {
      throw new ChannelAuthError('UNAUTHORIZED');
    }
    if (!payload.exp) throw new ChannelAuthError('UNAUTHORIZED');

    const user = await this.usuarios.findById(payload.sub);
    if (!user || !user.activo) throw new ChannelAuthError('UNAUTHORIZED');

    const expiresAt = payload.exp * 1000;

    if (user.rol === 'MAQUINA') {
      // El machineId enviado por el cliente no se usa: la máquina solo escucha su propia room.
      return { userId: user.id, machineId: user.id, expiresAt };
    }

    if (user.rol === 'ADMIN') {
      if (typeof requestedMachineId !== 'string')
        throw new ChannelAuthError('MACHINE_NOT_AUTHORIZED');
      const machine = await this.usuarios.findById(requestedMachineId).catch(() => null);
      if (!machine || machine.rol !== 'MAQUINA' || !machine.activo) {
        throw new ChannelAuthError('MACHINE_NOT_AUTHORIZED');
      }
      return { userId: user.id, machineId: machine.id, expiresAt };
    }

    // Lavadores y otros roles no tienen necesidad de este canal.
    throw new ChannelAuthError('FORBIDDEN');
  }
}
