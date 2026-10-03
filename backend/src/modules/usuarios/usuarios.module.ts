import { Module } from '@nestjs/common';
import { UsuariosController } from './api/controllers/usuarios.controller';
import { ActualizarUsuarioUseCase } from './application/use-cases/actualizar-usuario.use-case';
import { CambiarEstadoUsuarioUseCase } from './application/use-cases/cambiar-estado-usuario.use-case';
import { CrearUsuarioUseCase } from './application/use-cases/crear-usuario.use-case';
import { ListarUsuariosUseCase } from './application/use-cases/listar-usuarios.use-case';
import { RestablecerPasswordUseCase } from './application/use-cases/restablecer-password.use-case';
import { HASHER_PORT } from './domain/interfaces/hasher.port';
import { USUARIO_REPOSITORY } from './domain/interfaces/usuario-repository.port';
import { BcryptAdapter } from './infrastructure/adapters/bcrypt.adapter';
import { PrismaUsuarioRepository } from './infrastructure/repositories/prisma-usuario.repository';

@Module({
  controllers: [UsuariosController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    { provide: HASHER_PORT, useClass: BcryptAdapter },
    ListarUsuariosUseCase,
    CrearUsuarioUseCase,
    ActualizarUsuarioUseCase,
    CambiarEstadoUsuarioUseCase,
    RestablecerPasswordUseCase,
  ],
  exports: [USUARIO_REPOSITORY, HASHER_PORT],
})
export class UsuariosModule {}
