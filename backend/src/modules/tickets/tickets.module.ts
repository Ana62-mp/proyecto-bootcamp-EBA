import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TicketsController } from './api/controllers/tickets.controller';
import { TurnosController } from './api/controllers/turnos.controller';
import { TicketsEmisionGateway } from './api/gateways/tickets-emision.gateway';
import { EmissionChannelAuthService } from './application/services/emission-channel-auth.service';
import { TurnoDispatcherService } from './application/services/turno-dispatcher.service';
import {
  ColaActivaUseCase,
  ListarTurnosUseCase,
  ObtenerTicketUseCase,
  ObtenerTurnoUseCase,
} from './application/use-cases/consultar-turnos.use-case';
import { EmitirTicketUseCase } from './application/use-cases/emitir-ticket.use-case';
import {
  AsignarPendientesUseCase,
  AvanzarTurnoUseCase,
  CancelarTurnoUseCase,
  EntregarTurnoUseCase,
} from './application/use-cases/operar-turno.use-case';
import { TICKET_EMISSION_NOTIFIER } from './domain/interfaces/ticket-emission-notifier.port';
import { TICKET_REPOSITORY } from './domain/interfaces/ticket-repository.port';
import { SocketTicketEmissionNotifierAdapter } from './infrastructure/adapters/socket-ticket-emission-notifier.adapter';
import { PrismaTicketRepository } from './infrastructure/repositories/prisma-ticket.repository';

@Module({
  imports: [AuthModule, UsuariosModule],
  controllers: [TicketsController, TurnosController],
  providers: [
    { provide: TICKET_REPOSITORY, useClass: PrismaTicketRepository },
    { provide: TICKET_EMISSION_NOTIFIER, useClass: SocketTicketEmissionNotifierAdapter },
    TicketsEmisionGateway,
    EmissionChannelAuthService,
    TurnoDispatcherService,
    EmitirTicketUseCase,
    ObtenerTicketUseCase,
    ListarTurnosUseCase,
    ColaActivaUseCase,
    ObtenerTurnoUseCase,
    AvanzarTurnoUseCase,
    EntregarTurnoUseCase,
    CancelarTurnoUseCase,
    AsignarPendientesUseCase,
  ],
})
export class TicketsModule {}
