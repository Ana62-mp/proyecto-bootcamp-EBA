import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../../../../common/dtos/pagination.dto';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import {
  ListarServiciosUseCase,
  ObtenerServicioUseCase,
} from '../../application/use-cases/listar-servicios.use-case';
import {
  ListServiciosQueryDto,
  ServicioEnvelopeDto,
  ServicioResponseDto,
  ServiciosListDto,
} from '../dtos/servicio.dto';

@ApiTags('Servicios de lavado')
@ApiBearerAuth()
@ApiResponse({ status: 401, type: ErrorResponseDto })
@Controller('servicios')
export class ServiciosController {
  constructor(
    private readonly listar: ListarServiciosUseCase,
    private readonly obtener: ObtenerServicioUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Catálogo de servicios y precios (USD)' })
  @ApiResponse({ status: 200, type: ServiciosListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListServiciosQueryDto,
  ): Promise<ServiciosListDto> {
    const items = await this.listar.execute(user.rol, query.incluirInactivos);
    return { data: items.map((item) => ServicioResponseDto.from(item)) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un servicio' })
  @ApiResponse({ status: 200, type: ServicioEnvelopeDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServicioEnvelopeDto> {
    return { data: ServicioResponseDto.from(await this.obtener.execute(id, user.rol)) };
  }
}
