import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { USUARIO_REPOSITORY } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import { TokenIssuerService } from '../services/token-issuer.service';
import { InvalidTokenError, TokenVerifierService } from '../services/token-verifier.service';
import { SessionResult } from './login.use-case';

/**
 * Rota ambos tokens y revalida en base de datos que el usuario siga activo.
 * No detecta reutilización de un refresh anterior (ver README, sección de seguridad).
 */
@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    private readonly verifier: TokenVerifierService,
    private readonly tokens: TokenIssuerService,
  ) {}

  async execute(refreshToken: string | undefined): Promise<SessionResult> {
    const invalid = AppException.unauthorized(
      'INVALID_REFRESH_TOKEN',
      'La sesión expiró. Inicia sesión nuevamente.',
    );
    if (!refreshToken) throw invalid;

    let sub: string;
    try {
      sub = this.verifier.verify(refreshToken, 'refresh').sub;
    } catch (error) {
      if (error instanceof InvalidTokenError) throw invalid;
      throw error;
    }

    const user = await this.usuarios.findById(sub);
    if (!user || !user.activo) throw invalid;

    return {
      tokens: this.tokens.issue({ sub: user.id, usuario: user.usuario, rol: user.rol }),
      user,
    };
  }
}
