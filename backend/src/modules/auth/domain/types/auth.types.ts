import { RolUsuario } from '../../../../common/interfaces/authenticated-user.interface';

export type TokenType = 'access' | 'refresh';

export interface TokenSubject {
  sub: string;
  usuario: string;
  rol: RolUsuario;
}

export interface AuthPayload extends TokenSubject {
  typ: TokenType;
  iat?: number;
  exp?: number;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresInMs: number;
  refreshMaxAgeMs: number;
}
