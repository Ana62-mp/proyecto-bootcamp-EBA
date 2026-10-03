import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from '../../../../common/dtos/pagination.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ActualizarUsuarioUseCase } from '../../application/use-cases/actualizar-usuario.use-case';
import { CambiarEstadoUsuarioUseCase } from '../../application/use-cases/cambiar-estado-usuario.use-case';
import { CrearUsuarioUseCase } from '../../application/use-cases/crear-usuario.use-case';
import { ListarUsuariosUseCase } from '../../application/use-cases/listar-usuarios.use-case';
import { RestablecerPasswordUseCase } from '../../application/use-cases/restablecer-password.use-case';
import {
  CambiarEstadoDto,
  CreateUsuarioDto,
  ListUsuariosQueryDto,
  RestablecerPasswordDto,
  UpdateUsuarioDto,
  UsuarioEnvelopeDto,
  UsuarioResponseDto,
  UsuariosPageDto,
} from '../dtos/usuario.dto';

@ApiTags('Usuarios')
@ApiBearerAuth()
@ApiResponse({ status: 401, type: ErrorResponseDto })
@ApiResponse({ status: 403, type: ErrorResponseDto })
@Roles('ADMIN')
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly listar: ListarUsuariosUseCase,
    private readonly crear: CrearUsuarioUseCase,
    private readonly actualizar: ActualizarUsuarioUseCase,
    private readonly cambiarEstado: CambiarEstadoUsuarioUseCase,
    private readonly restablecer: RestablecerPasswordUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista paginada de usuarios con filtros' })
  @ApiResponse({ status: 200, type: UsuariosPageDto })
  async list(@Query() query: ListUsuariosQueryDto): Promise<UsuariosPageDto> {
    const result = await this.listar.execute(
      { searchTerm: query.searchTerm, rol: query.rol, activo: query.activo },
      query.page,
      query.pageSize,
    );
    const { items, ...meta } = result;
    return { data: items.map((item) => UsuarioResponseDto.from(item)), meta };
  }

  @Post()
  @ApiOperation({ summary: 'Crea una máquina o un lavador (no administradores)' })
  @ApiResponse({ status: 201, type: UsuarioEnvelopeDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto })
  async create(@Body() dto: CreateUsuarioDto): Promise<UsuarioEnvelopeDto> {
    return { data: UsuarioResponseDto.from(await this.crear.execute(dto)) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza datos del usuario (regla de administrador único)' })
  @ApiResponse({ status: 200, type: UsuarioEnvelopeDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
  ): Promise<UsuarioEnvelopeDto> {
    return { data: UsuarioResponseDto.from(await this.actualizar.execute(id, dto)) };
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Activa o desactiva un usuario (el administrador no se desactiva)' })
  @ApiResponse({ status: 200, type: UsuarioEnvelopeDto })
  async setEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoDto,
  ): Promise<UsuarioEnvelopeDto> {
    return { data: UsuarioResponseDto.from(await this.cambiarEstado.execute(id, dto.activo)) };
  }

  @Post(':id/restablecer-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Asigna una contraseña temporal' })
  @ApiResponse({ status: 204 })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestablecerPasswordDto,
  ): Promise<void> {
    await this.restablecer.execute(id, dto.nuevoPasswordTemporal);
  }
}
