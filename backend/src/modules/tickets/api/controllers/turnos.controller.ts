import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../../../common/dtos/pagination.dto';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import {
  ColaActivaUseCase,
  ListarTurnosUseCase,
  ObtenerTurnoUseCase,
} from '../../application/use-cases/consultar-turnos.use-case';
import {
  AsignarPendientesUseCase,
  AvanzarTurnoUseCase,
  CancelarTurnoUseCase,
  EntregarTurnoUseCase,
} from '../../application/use-cases/operar-turno.use-case';
import {
  AvanzarTurnoResponseDto,
  ColaPublicaDto,
  ListTurnosQueryDto,
  TurnoEnvelopeDto,
  TurnoPublicoDto,
  TurnoResponseDto,
  TurnosListDto,
  TurnosPageDto,
} from '../dtos/turno.dto';

/** Seguimiento operativo por HTTP REST. Estas rutas no emiten eventos WebSocket (§11.5). */
@ApiTags('Turnos')
@ApiBearerAuth()
@ApiResponse({ status: 401, type: ErrorResponseDto })
@ApiResponse({ status: 403, type: ErrorResponseDto })
@Controller('turnos')
export class TurnosController {
  constructor(
    private readonly listar: ListarTurnosUseCase,
    private readonly cola: ColaActivaUseCase,
    private readonly obtener: ObtenerTurnoUseCase,
    private readonly avanzar: AvanzarTurnoUseCase,
    private readonly entregar: EntregarTurnoUseCase,
    private readonly cancelar: CancelarTurnoUseCase,
    private readonly asignar: AsignarPendientesUseCase,
  ) {}

  @Get('cola')
  @Roles('ADMIN', 'MAQUINA', 'LAVADOR')
  @ApiOperation({ summary: 'Cola activa FIFO sin datos personales (kiosko y monitor)' })
  @ApiResponse({ status: 200, type: ColaPublicaDto })
  async colaPublica(): Promise<ColaPublicaDto> {
    return { data: (await this.cola.execute()).map((item) => TurnoPublicoDto.from(item)) };
  }

  @Get('activos')
  @Roles('ADMIN', 'LAVADOR')
  @ApiOperation({ summary: 'Turnos activos con datos operativos completos (estaciones y resumen)' })
  @ApiResponse({ status: 200, type: TurnosListDto })
  async activos(): Promise<TurnosListDto> {
    return { data: (await this.cola.execute()).map((item) => TurnoResponseDto.from(item)) };
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Historial paginado con filtros por estado, fechas y texto' })
  @ApiResponse({ status: 200, type: TurnosPageDto })
  async list(@Query() query: ListTurnosQueryDto): Promise<TurnosPageDto> {
    const { items, ...meta } = await this.listar.execute(
      {
        estados: query.estado,
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
        searchTerm: query.searchTerm,
      },
      query.page,
      query.pageSize,
    );
    return { data: items.map((item) => TurnoResponseDto.from(item)), meta };
  }

  @Post('asignar-pendientes')
  @HttpCode(200)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Ejecuta el despachador FIFO sobre estaciones libres' })
  @ApiResponse({ status: 200, type: TurnosListDto })
  async asignarPendientes(@CurrentUser() actor: AuthenticatedUser): Promise<TurnosListDto> {
    return { data: (await this.asignar.execute(actor)).map((item) => TurnoResponseDto.from(item)) };
  }

  @Get(':id')
  @Roles('ADMIN', 'LAVADOR')
  @ApiOperation({ summary: 'Detalle del turno con historial de estados' })
  @ApiResponse({ status: 200, type: TurnoEnvelopeDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<TurnoEnvelopeDto> {
    return { data: TurnoResponseDto.from(await this.obtener.execute(id)) };
  }

  @Post(':id/avanzar')
  @HttpCode(200)
  @Roles('ADMIN', 'LAVADOR')
  @ApiOperation({ summary: 'LAVANDO → SECANDO_PULIENDO → LISTO (libera estación y despacha)' })
  @ApiResponse({ status: 200, type: AvanzarTurnoResponseDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'TRANSICION_INVALIDA' })
  async advance(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AvanzarTurnoResponseDto> {
    const result = await this.avanzar.execute(id, actor);
    return {
      data: TurnoResponseDto.from(result.turno),
      meta: { asignados: result.asignados.map((item) => TurnoResponseDto.from(item)) },
    };
  }

  @Post(':id/entregar')
  @HttpCode(200)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'LISTO → ENTREGADO' })
  @ApiResponse({ status: 200, type: TurnoEnvelopeDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'TRANSICION_INVALIDA' })
  async deliver(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TurnoEnvelopeDto> {
    return { data: TurnoResponseDto.from(await this.entregar.execute(id, actor)) };
  }

  @Post(':id/cancelar')
  @HttpCode(200)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'EN_ESPERA → CANCELADO' })
  @ApiResponse({ status: 200, type: TurnoEnvelopeDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'TRANSICION_INVALIDA' })
  async cancel(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TurnoEnvelopeDto> {
    return { data: TurnoResponseDto.from(await this.cancelar.execute(id, actor)) };
  }
}
