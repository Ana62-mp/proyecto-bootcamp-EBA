import { Module } from '@nestjs/common';
import { ServiciosController } from './api/controllers/servicios.controller';
import {
  ListarServiciosUseCase,
  ObtenerServicioUseCase,
} from './application/use-cases/listar-servicios.use-case';
import { SERVICIO_REPOSITORY } from './domain/interfaces/servicio-repository.port';
import { PrismaServicioRepository } from './infrastructure/repositories/prisma-servicio.repository';

@Module({
  controllers: [ServiciosController],
  providers: [
    { provide: SERVICIO_REPOSITORY, useClass: PrismaServicioRepository },
    ListarServiciosUseCase,
    ObtenerServicioUseCase,
  ],
})
export class ServiciosModule {}
