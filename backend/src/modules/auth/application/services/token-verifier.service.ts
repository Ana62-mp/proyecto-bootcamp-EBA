import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload, TokenType } from '../../domain/types/auth.types';

export class InvalidTokenError extends Error {
  constructor() {
    super('Token inválido');
    this.name = 'InvalidTokenError';
  }
}

/** Verifica firma, expiración y tipo del token (usado por refresh y por el handshake WebSocket). */
@Injectable()
export class TokenVerifierService {
  constructor(private readonly jwt: JwtService) {}

  verify(token: string, expected: TokenType): AuthPayload {
    let payload: AuthPayload;
    try {
      payload = this.jwt.verify<AuthPayload>(token);
    } catch {
      throw new InvalidTokenError();
    }
    if (payload.typ !== expected || typeof payload.sub !== 'string') {
      throw new InvalidTokenError();
    }
    return payload;
  }
}
