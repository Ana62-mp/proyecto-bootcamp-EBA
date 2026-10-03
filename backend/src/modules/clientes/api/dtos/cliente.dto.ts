import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationMetaDto, PaginationQueryDto } from '../../../../common/dtos/pagination.dto';
import { ClienteRecord } from '../../domain/types/cliente.types';

const TIPOS_DOCUMENTO = ['CEDULA', 'PASAPORTE', 'RUC'] as const;
const TIPOS_VEHICULO = ['AUTOMOVIL', 'SUV', 'CAMIONETA', 'OTRO'] as const;
const toBool = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

export class BuscarClienteQueryDto {
  @ApiProperty({ enum: TIPOS_DOCUMENTO })
  @IsIn(TIPOS_DOCUMENTO)
  tipoDocumento!: (typeof TIPOS_DOCUMENTO)[number];

  @ApiProperty({ example: '1710034065' })
  @IsString()
  @MaxLength(20)
  numeroDocumento!: string;
}

export class ListClientesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Documento, nombres, razón social, teléfono o placa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  searchTerm?: string;

  @ApiPropertyOptional({ enum: TIPOS_DOCUMENTO })
  @IsOptional()
  @IsIn(TIPOS_DOCUMENTO)
  tipoDocumento?: (typeof TIPOS_DOCUMENTO)[number];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({
    example: '2026-09-01',
    description: 'Fecha de registro desde (inclusive)',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  fechaDesde?: string;

  @ApiPropertyOptional({
    example: '2026-09-30',
    description: 'Fecha de registro hasta (inclusive)',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  fechaHasta?: string;
}

export class CreateClienteDto {
  @ApiProperty({ enum: TIPOS_DOCUMENTO })
  @IsIn(TIPOS_DOCUMENTO)
  tipoDocumento!: (typeof TIPOS_DOCUMENTO)[number];

  @ApiProperty({ example: '1710034065' })
  @IsString()
  @MaxLength(20)
  numeroDocumento!: string;

  @ApiPropertyOptional({ example: 'Roberto Carlos', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombres?: string | null;

  @ApiPropertyOptional({ example: 'Andrade Velasteguí', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellidos?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Obligatoria para RUC' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  razonSocial?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Solo RUC' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombreContacto?: string | null;

  @ApiProperty({ example: '0998765432' })
  @IsString()
  @MaxLength(10)
  telefono!: string;

  @ApiPropertyOptional({ example: 'roberto.andrade@gmail.com', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  correo?: string | null;
}

export class UpdateClienteDto extends PartialType(CreateClienteDto) {}

export class CambiarEstadoClienteDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  activo!: boolean;
}

export class VehiculoResumenDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) clienteId!: string;
  @ApiProperty({ example: 'PBH4321', description: 'Placa canónica sin guion' }) placa!: string;
  @ApiProperty({ example: 'Chevrolet' }) marca!: string;
  @ApiProperty({ example: 'Sail' }) modelo!: string;
  @ApiProperty({ example: 'Plata' }) color!: string;
  @ApiProperty({ enum: TIPOS_VEHICULO }) tipoVehiculo!: string;
  @ApiProperty() activo!: boolean;
}

export class ClienteResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: TIPOS_DOCUMENTO }) tipoDocumento!: string;
  @ApiProperty({ example: '1710034065' }) numeroDocumento!: string;
  @ApiProperty({ nullable: true, type: String }) nombres!: string | null;
  @ApiProperty({ nullable: true, type: String }) apellidos!: string | null;
  @ApiProperty({ nullable: true, type: String }) razonSocial!: string | null;
  @ApiProperty({ nullable: true, type: String }) nombreContacto!: string | null;
  @ApiProperty({ example: '0998765432' }) telefono!: string;
  @ApiProperty({ nullable: true, type: String }) correo!: string | null;
  @ApiProperty() activo!: boolean;
  @ApiProperty({ type: [VehiculoResumenDto] }) vehiculos!: VehiculoResumenDto[];
  @ApiProperty({ description: 'Fecha de registro (ISO 8601 UTC)' }) fechaRegistro!: string;
  @ApiProperty() fechaActualizacion!: string;

  static from(record: ClienteRecord): ClienteResponseDto {
    const { createdAt, updatedAt, ...rest } = record;
    return {
      ...rest,
      vehiculos: record.vehiculos.map((v) => ({ ...v })),
      fechaRegistro: createdAt.toISOString(),
      fechaActualizacion: updatedAt.toISOString(),
    };
  }
}

export class ClienteEnvelopeDto {
  @ApiProperty({ type: ClienteResponseDto }) data!: ClienteResponseDto;
}

export class ClienteBusquedaDto {
  @ApiProperty({
    type: ClienteResponseDto,
    nullable: true,
    description: 'null si es un cliente nuevo',
  })
  data!: ClienteResponseDto | null;
}

export class ClientesPageDto {
  @ApiProperty({ type: [ClienteResponseDto] }) data!: ClienteResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
