import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import type { Response } from 'express';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../../../common/dtos/pagination.dto';
import { AppException } from '../../../../common/errors/app.exception';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { ObtenerTicketUseCase } from '../../application/use-cases/consultar-turnos.use-case';
import { EmitirTicketUseCase } from '../../application/use-cases/emitir-ticket.use-case';
import { EmitirTicketDto } from '../dtos/emitir-ticket.dto';
import {
  TicketEmisionResponseDto,
  TicketEnvelopeDto,
  TicketResponseDto,
} from '../dtos/ticket-response.dto';

@ApiTags('Tickets')
@ApiBearerAuth()
@ApiResponse({ status: 401, type: ErrorResponseDto })
@ApiResponse({ status: 403, type: ErrorResponseDto })
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly emitir: EmitirTicketUseCase,
    private readonly obtener: ObtenerTicketUseCase,
  ) {}

  @Post('emision')
  @Roles('MAQUINA', 'ADMIN')
  @ApiOperation({
    summary: 'Emite un ticket de lavado',
    description:
      'Única operación que notifica por WebSocket (`ticket:emitido` en /tickets-emision), ' +
      'después del commit. 201 en emisión nueva; 200 al recuperar la misma emisión por idempotencia.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID generado por el frontend',
  })
  @ApiResponse({ status: 201, type: TicketEmisionResponseDto })
  @ApiResponse({
    status: 200,
    type: TicketEmisionResponseDto,
    description: 'Reintento idempotente',
  })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'IDEMPOTENCY_KEY_REUSED, VEHICULO_CON_TURNO_ACTIVO, SERVICIO_INACTIVO…',
  })
  async emitirTicket(
    @CurrentUser() actor: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: EmitirTicketDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TicketEmisionResponseDto> {
    if (!idempotencyKey || !isUUID(idempotencyKey)) {
      throw AppException.badRequest(
        'INVALID_IDEMPOTENCY_KEY',
        'El header Idempotency-Key debe ser un UUID.',
        [{ field: 'Idempotency-Key', message: 'UUID requerido.' }],
      );
    }
    const key = idempotencyKey.toLowerCase();
    const result = await this.emitir.execute({
      actor,
      idempotencyKey: key,
      clienteId: dto.clienteId,
      vehiculoId: dto.vehiculoId,
      servicioLavadoId: dto.servicioLavadoId,
      machineId: dto.machineId,
    });
    res.status(result.replayed ? 200 : 201);
    return {
      data: TicketResponseDto.from(result.ticket),
      meta: { requestId: key, replayed: result.replayed },
    };
  }

  @Get(':id')
  @Roles('MAQUINA', 'ADMIN')
  @ApiOperation({ summary: 'Comprobante para reimpresión (una máquina solo ve sus tickets)' })
  @ApiResponse({ status: 200, type: TicketEnvelopeDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async get(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TicketEnvelopeDto> {
    return { data: TicketResponseDto.from(await this.obtener.execute(id, actor)) };
  }
}
