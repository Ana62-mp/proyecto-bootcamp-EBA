import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { durationToMs } from '../../../../common/utils/duration';
import { IssuedTokens, TokenSubject } from '../../domain/types/auth.types';

/** Firma access y refresh con el mismo secreto; se distinguen por el claim `typ`. */
@Injectable()
export class TokenIssuerService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  issue(subject: TokenSubject): IssuedTokens {
    const accessExpiresIn = this.config.getOrThrow<string>('JWT_EXPIRES_IN');
    const refreshExpiresIn = this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
    const claims = { sub: subject.sub, usuario: subject.usuario, rol: subject.rol };
    return {
      accessToken: this.jwt.sign(
        { ...claims, typ: 'access' },
        { expiresIn: durationToMs(accessExpiresIn) / 1000 },
      ),
      refreshToken: this.jwt.sign(
        { ...claims, typ: 'refresh' },
        { expiresIn: durationToMs(refreshExpiresIn) / 1000 },
      ),
      accessExpiresInMs: durationToMs(accessExpiresIn),
      refreshMaxAgeMs: durationToMs(refreshExpiresIn),
    };
  }
}
