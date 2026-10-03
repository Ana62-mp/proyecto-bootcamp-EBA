import { Module } from '@nestjs/common';
import { ClientesController } from './api/controllers/clientes.controller';
import {
  BuscarClientePorDocumentoUseCase,
  ListarClientesUseCase,
  ObtenerClienteUseCase,
} from './application/use-cases/consultar-clientes.use-case';
import {
  ActualizarClienteUseCase,
  CambiarEstadoClienteUseCase,
  CrearClienteUseCase,
} from './application/use-cases/gestionar-cliente.use-case';
import { CLIENTE_REPOSITORY } from './domain/interfaces/cliente-repository.port';
import { PrismaClienteRepository } from './infrastructure/repositories/prisma-cliente.repository';

@Module({
  controllers: [ClientesController],
  providers: [
    { provide: CLIENTE_REPOSITORY, useClass: PrismaClienteRepository },
    BuscarClientePorDocumentoUseCase,
    ObtenerClienteUseCase,
    ListarClientesUseCase,
    CrearClienteUseCase,
    ActualizarClienteUseCase,
    CambiarEstadoClienteUseCase,
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClientesModule {}
