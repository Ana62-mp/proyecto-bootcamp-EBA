import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './api/controllers/auth.controller';
import { TokenIssuerService } from './application/services/token-issuer.service';
import { TokenVerifierService } from './application/services/token-verifier.service';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { ObtenerUsuarioActualUseCase } from './application/use-cases/obtener-usuario-actual.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { JwtStrategy } from './infrastructure/adapters/jwt.strategy';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    TokenIssuerService,
    TokenVerifierService,
    LoginUseCase,
    RefreshSessionUseCase,
    ObtenerUsuarioActualUseCase,
  ],
  exports: [TokenVerifierService],
})
export class AuthModule {}
