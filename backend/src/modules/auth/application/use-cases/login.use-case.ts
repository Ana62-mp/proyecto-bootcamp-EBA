import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { HASHER_PORT } from '../../../usuarios/domain/interfaces/hasher.port';
import type { HasherPort } from '../../../usuarios/domain/interfaces/hasher.port';
import { USUARIO_REPOSITORY } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import { UsuarioRecord } from '../../../usuarios/domain/types/usuario.types';
import { IssuedTokens } from '../../domain/types/auth.types';
import { TokenIssuerService } from '../services/token-issuer.service';

export interface SessionResult {
  tokens: IssuedTokens;
  user: UsuarioRecord;
}

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);
  private dummyHash?: Promise<string>;

  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(HASHER_PORT) private readonly hasher: HasherPort,
    private readonly tokens: TokenIssuerService,
  ) {}

  async execute(usuario: string, password: string): Promise<SessionResult> {
    const found = await this.usuarios.findByUsuarioWithPassword(usuario.trim().toLowerCase());

    // Compara siempre contra un hash para no revelar por tiempo si el usuario existe.
    this.dummyHash ??= this.hasher.hash('usuario-inexistente');
    const hash = found?.passwordHash ?? (await this.dummyHash);
    const valid = await this.hasher.compare(password, hash);

    if (!found || !valid) {
      throw AppException.unauthorized('INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos.');
    }
    if (!found.activo) {
      throw AppException.forbidden(
        'USER_INACTIVE',
        'Esta cuenta se encuentra desactivada. Contacte al administrador.',
      );
    }

    this.logger.log(`Inicio de sesión usuarioId=${found.id} rol=${found.rol}`);
    const { passwordHash: _omit, ...user } = found;
    return {
      tokens: this.tokens.issue({ sub: user.id, usuario: user.usuario, rol: user.rol }),
      user,
    };
  }
}
