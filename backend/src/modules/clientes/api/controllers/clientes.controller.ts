import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../../../common/dtos/pagination.dto';
import {
  BuscarClientePorDocumentoUseCase,
  ListarClientesUseCase,
  ObtenerClienteUseCase,
} from '../../application/use-cases/consultar-clientes.use-case';
import {
  ActualizarClienteUseCase,
  CambiarEstadoClienteUseCase,
  CrearClienteUseCase,
} from '../../application/use-cases/gestionar-cliente.use-case';
import {
  BuscarClienteQueryDto,
  CambiarEstadoClienteDto,
  ClienteBusquedaDto,
  ClienteEnvelopeDto,
  ClienteResponseDto,
  ClientesPageDto,
  CreateClienteDto,
  ListClientesQueryDto,
  UpdateClienteDto,
} from '../dtos/cliente.dto';

@ApiTags('Clientes')
@ApiBearerAuth()
@ApiResponse({ status: 400, type: ErrorResponseDto })
@ApiResponse({ status: 401, type: ErrorResponseDto })
@ApiResponse({ status: 403, type: ErrorResponseDto })
@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly buscar: BuscarClientePorDocumentoUseCase,
    private readonly obtener: ObtenerClienteUseCase,
    private readonly listar: ListarClientesUseCase,
    private readonly crear: CrearClienteUseCase,
    private readonly actualizar: ActualizarClienteUseCase,
    private readonly cambiarEstado: CambiarEstadoClienteUseCase,
  ) {}

  // Rutas fijas antes de ':id'.
  @Get('buscar')
  @Roles('ADMIN', 'MAQUINA')
  @ApiOperation({ summary: 'Kiosko: busca un cliente por documento (data: null si es nuevo)' })
  @ApiResponse({ status: 200, type: ClienteBusquedaDto })
  async findByDocumento(@Query() query: BuscarClienteQueryDto): Promise<ClienteBusquedaDto> {
    const cliente = await this.buscar.execute(query.tipoDocumento, query.numeroDocumento);
    return { data: cliente ? ClienteResponseDto.from(cliente) : null };
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lista paginada de clientes con filtros combinables' })
  @ApiResponse({ status: 200, type: ClientesPageDto })
  async list(@Query() query: ListClientesQueryDto): Promise<ClientesPageDto> {
    const { items, ...meta } = await this.listar.execute(
      {
        searchTerm: query.searchTerm,
        tipoDocumento: query.tipoDocumento,
        activo: query.activo,
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
      },
      query.page,
      query.pageSize,
    );
    return { data: items.map((item) => ClienteResponseDto.from(item)), meta };
  }

  @Get(':id')
  @Roles('ADMIN', 'MAQUINA')
  @ApiOperation({ summary: 'Detalle de cliente con sus vehículos' })
  @ApiResponse({ status: 200, type: ClienteEnvelopeDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<ClienteEnvelopeDto> {
    return { data: ClienteResponseDto.from(await this.obtener.execute(id)) };
  }

  @Post()
  @Roles('ADMIN', 'MAQUINA')
  @ApiOperation({ summary: 'Registra un cliente (vehículos se registran en /vehicles)' })
  @ApiResponse({ status: 201, type: ClienteEnvelopeDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'CLIENTE_DUPLICADO' })
  async create(@Body() dto: CreateClienteDto): Promise<ClienteEnvelopeDto> {
    return { data: ClienteResponseDto.from(await this.crear.execute(dto)) };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualiza datos del cliente' })
  @ApiResponse({ status: 200, type: ClienteEnvelopeDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClienteDto,
  ): Promise<ClienteEnvelopeDto> {
    return { data: ClienteResponseDto.from(await this.actualizar.execute(id, dto)) };
  }

  @Patch(':id/estado')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Activa o desactiva (no permitido con turno activo)' })
  @ApiResponse({ status: 200, type: ClienteEnvelopeDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'CLIENTE_CON_TURNO_ACTIVO' })
  async setEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoClienteDto,
  ): Promise<ClienteEnvelopeDto> {
    return { data: ClienteResponseDto.from(await this.cambiarEstado.execute(id, dto.activo)) };
  }
}
