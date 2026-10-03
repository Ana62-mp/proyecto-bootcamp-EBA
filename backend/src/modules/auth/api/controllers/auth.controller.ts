import { Body, Controller, Get, HttpCode, Logger, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Public } from '../../../../common/decorators/public.decorator';
import { ErrorResponseDto } from '../../../../common/dtos/pagination.dto';
import { AppException } from '../../../../common/errors/app.exception';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { isOriginAllowed } from '../../../../common/utils/origin';
import { parseAllowedOrigins } from '../../../../context/config/app.config';
import { UsuarioEnvelopeDto, UsuarioResponseDto } from '../../../usuarios/api/dtos/usuario.dto';
import { LoginUseCase, SessionResult } from '../../application/use-cases/login.use-case';
import { ObtenerUsuarioActualUseCase } from '../../application/use-cases/obtener-usuario-actual.use-case';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { LoginDto, SessionEnvelopeDto } from '../dtos/auth.dto';

export const REFRESH_COOKIE = 'refresh_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly allowedOrigins: string[];

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshSessionUseCase,
    private readonly currentUserUseCase: ObtenerUsuarioActualUseCase,
    private readonly config: ConfigService,
  ) {
    this.allowedOrigins = parseAllowedOrigins(config.getOrThrow<string>('FRONTEND_URL'));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Inicia sesión; el refresh token se entrega solo en cookie httpOnly' })
  @ApiResponse({ status: 200, type: SessionEnvelopeDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'INVALID_CREDENTIALS' })
  @ApiResponse({ status: 403, type: ErrorResponseDto, description: 'USER_INACTIVE' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionEnvelopeDto> {
    const session = await this.loginUseCase.execute(dto.usuario, dto.password);
    return this.respondWithSession(session, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({ summary: 'Rota access y refresh token. Requiere Origin permitido.' })
  @ApiResponse({ status: 200, type: SessionEnvelopeDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'INVALID_REFRESH_TOKEN' })
  @ApiResponse({ status: 403, type: ErrorResponseDto, description: 'ORIGIN_NOT_ALLOWED' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionEnvelopeDto> {
    this.assertAllowedOrigin(req);
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const session = await this.refreshUseCase.execute(cookies?.[REFRESH_COOKIE]);
    return this.respondWithSession(session, res);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Elimina la cookie del refresh token' })
  @ApiResponse({ status: 204 })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): void {
    this.assertAllowedOrigin(req);
    const { maxAge: _maxAge, ...options } = this.cookieOptions(0);
    res.clearCookie(REFRESH_COOKIE, options);
    this.logger.log('Cierre de sesión: cookie de refresh eliminada');
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuario autenticado actual' })
  @ApiResponse({ status: 200, type: UsuarioEnvelopeDto })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UsuarioEnvelopeDto> {
    return { data: UsuarioResponseDto.from(await this.currentUserUseCase.execute(user.id)) };
  }

  private respondWithSession(session: SessionResult, res: Response): SessionEnvelopeDto {
    res.cookie(
      REFRESH_COOKIE,
      session.tokens.refreshToken,
      this.cookieOptions(session.tokens.refreshMaxAgeMs),
    );
    return {
      data: {
        accessToken: session.tokens.accessToken,
        expiresIn: Math.floor(session.tokens.accessExpiresInMs / 1000),
        user: UsuarioResponseDto.from(session.user),
      },
    };
  }

  private cookieOptions(maxAgeMs: number): CookieOptions {
    const secure =
      this.config.get<boolean>('COOKIE_SECURE') ??
      this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure,
      sameSite: this.config.getOrThrow<'lax' | 'strict' | 'none'>('COOKIE_SAMESITE'),
      path: this.config.getOrThrow<string>('COOKIE_PATH'),
      ...(this.config.get<boolean>('COOKIE_PERSISTENT') ? { maxAge: maxAgeMs } : {}),
    };
  }

  /** Defensa CSRF adicional: Origin permitido o del mismo host que la petición. */
  private assertAllowedOrigin(req: Request): void {
    if (!isOriginAllowed(req.headers.origin, this.allowedOrigins, req.headers.host)) {
      throw AppException.forbidden('ORIGIN_NOT_ALLOWED', 'Origen de la petición no permitido.');
    }
  }
}
