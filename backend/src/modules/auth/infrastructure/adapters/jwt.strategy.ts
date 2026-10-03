import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { AuthPayload } from '../../domain/types/auth.types';

/** Valida el access token del header Authorization. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: AuthPayload): AuthenticatedUser {
    if (payload.typ !== 'access') throw new UnauthorizedException('Token inválido');
    return { id: payload.sub, usuario: payload.usuario, rol: payload.rol };
  }
}
