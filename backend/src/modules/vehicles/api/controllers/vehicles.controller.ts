import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../../../common/dtos/pagination.dto';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { LookupVehicleUseCase } from '../../application/use-cases/lookup-vehicle.use-case';
import {
  GetVehicleUseCase,
  UpdateVehicleUseCase,
} from '../../application/use-cases/manage-vehicle.use-case';
import { RegisterVehicleUseCase } from '../../application/use-cases/register-vehicle.use-case';
import { LookupVehicleQueryDto } from '../dtos/lookup-vehicle.dto';
import { VehicleLookupResponseDto } from '../dtos/vehicle-lookup-response.dto';
import {
  RegisterVehicleDto,
  RegisterVehicleResponseDto,
  UpdateVehicleDto,
  VehicleEnvelopeDto,
  VehicleResponseDto,
} from '../dtos/vehicle.dto';

@ApiTags('Vehículos')
@ApiBearerAuth()
@ApiResponse({ status: 401, type: ErrorResponseDto })
@ApiResponse({ status: 403, type: ErrorResponseDto })
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly lookupUseCase: LookupVehicleUseCase,
    private readonly registerUseCase: RegisterVehicleUseCase,
    private readonly getUseCase: GetVehicleUseCase,
    private readonly updateUseCase: UpdateVehicleUseCase,
  ) {}

  // Declarada antes de ':id' para que "lookup" no se interprete como ID.
  @Get('lookup')
  @Roles('ADMIN', 'MAQUINA')
  @ApiOperation({
    summary: 'Botón «Validar»: datos del vehículo por placa (local primero, luego webservices.ec)',
    description:
      'Solo lectura: no registra vehículos, clientes ni tickets y no emite eventos WebSocket.',
  })
  @ApiResponse({ status: 200, type: VehicleLookupResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'INVALID_LICENSE_PLATE' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'VEHICLE_NOT_FOUND' })
  @ApiResponse({ status: 429, type: ErrorResponseDto, description: 'LOOKUP_RATE_LIMITED' })
  @ApiResponse({
    status: 502,
    type: ErrorResponseDto,
    description: 'VEHICLE_PROVIDER_INVALID_RESPONSE',
  })
  @ApiResponse({ status: 503, type: ErrorResponseDto, description: 'VEHICLE_PROVIDER_UNAVAILABLE' })
  @ApiResponse({ status: 504, type: ErrorResponseDto, description: 'VEHICLE_PROVIDER_TIMEOUT' })
  async lookup(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: LookupVehicleQueryDto,
  ): Promise<VehicleLookupResponseDto> {
    return VehicleLookupResponseDto.from(
      await this.lookupUseCase.execute(user.id, query.licensePlate),
    );
  }

  @Post()
  @Roles('ADMIN', 'MAQUINA')
  @ApiOperation({
    summary: 'Confirma el registro del vehículo y lo asocia al cliente seleccionado',
    description:
      '201 si se creó; 200 si la placa ya era del mismo cliente (se actualiza y reactiva).',
  })
  @ApiResponse({ status: 201, type: RegisterVehicleResponseDto })
  @ApiResponse({ status: 200, type: RegisterVehicleResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'INVALID_LICENSE_PLATE' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'CLIENTE_NO_ENCONTRADO' })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'PLACA_REGISTRADA_OTRO_CLIENTE',
  })
  async register(
    @Body() dto: RegisterVehicleDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterVehicleResponseDto> {
    const result = await this.registerUseCase.execute(dto);
    res.status(result.created ? 201 : 200);
    return { data: VehicleResponseDto.from(result.vehicle), meta: { created: result.created } };
  }

  @Get(':id')
  @Roles('ADMIN', 'MAQUINA')
  @ApiOperation({ summary: 'Detalle del vehículo' })
  @ApiResponse({ status: 200, type: VehicleEnvelopeDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<VehicleEnvelopeDto> {
    return { data: VehicleResponseDto.from(await this.getUseCase.execute(id)) };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Edita o desactiva un vehículo' })
  @ApiResponse({ status: 200, type: VehicleEnvelopeDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'VEHICULO_CON_TURNO_ACTIVO' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleEnvelopeDto> {
    return { data: VehicleResponseDto.from(await this.updateUseCase.execute(id, dto)) };
  }
}
