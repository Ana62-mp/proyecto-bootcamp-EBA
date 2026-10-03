import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleRecord } from '../../domain/types/vehicle.types';

const TIPOS_VEHICULO = ['AUTOMOVIL', 'SUV', 'CAMIONETA', 'OTRO'] as const;

class VehicleEditableFieldsDto {
  @ApiPropertyOptional({ nullable: true, example: 2007 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'CAMIONETA' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  vehicleClass?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'ECUADOR' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'PARTICULAR' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  serviceType?: string | null;
}

export class RegisterVehicleDto extends VehicleEditableFieldsDto {
  @ApiProperty({ format: 'uuid', description: 'Cliente seleccionado explícitamente' })
  @IsUUID()
  clienteId!: string;

  @ApiProperty({ example: 'PBH-1234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  placa!: string;

  @ApiProperty({ enum: TIPOS_VEHICULO })
  @IsIn(TIPOS_VEHICULO)
  tipoVehiculo!: (typeof TIPOS_VEHICULO)[number];

  @ApiProperty({ example: 'Chevrolet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  marca!: string;

  @ApiProperty({ example: 'D-Max' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  modelo!: string;

  @ApiProperty({ example: 'Vino' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  color!: string;
}

export class UpdateVehicleDto extends VehicleEditableFieldsDto {
  @ApiPropertyOptional({ enum: TIPOS_VEHICULO })
  @IsOptional()
  @IsIn(TIPOS_VEHICULO)
  tipoVehiculo?: (typeof TIPOS_VEHICULO)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class VehicleResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) clienteId!: string;
  @ApiProperty({ example: 'PBH1234' }) placa!: string;
  @ApiProperty({ enum: TIPOS_VEHICULO }) tipoVehiculo!: string;
  @ApiProperty({ example: 'Chevrolet' }) marca!: string;
  @ApiProperty({ example: 'D-Max' }) modelo!: string;
  @ApiProperty({ example: 'Vino' }) color!: string;
  @ApiProperty() activo!: boolean;
  @ApiProperty({ nullable: true, type: Number }) providerVehicleId!: number | null;
  @ApiProperty({ nullable: true, type: String }) vehicleClass!: string | null;
  @ApiProperty({ nullable: true, type: Number }) year!: number | null;
  @ApiProperty({ nullable: true, type: String }) country!: string | null;
  @ApiProperty({ nullable: true, type: String }) serviceType!: string | null;
  @ApiProperty({ nullable: true, type: String }) registrationDate!: string | null;
  @ApiProperty({ nullable: true, type: String }) registrationExpiryDate!: string | null;
  @ApiProperty({ nullable: true, type: Number }) providerAutoYear!: number | null;
  @ApiProperty({ nullable: true, type: String }) chassis!: string | null;
  @ApiProperty({ nullable: true, type: String }) engineNumber!: string | null;
  @ApiProperty({
    enum: ['MANUAL', 'WEBSERVICES_EC'],
    description: 'MANUAL = no verificado por proveedor',
  })
  dataSource!: string;
  @ApiProperty({ nullable: true, type: String }) providerQueriedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static from(record: VehicleRecord): VehicleResponseDto {
    return {
      ...record,
      providerQueriedAt: record.providerQueriedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

export class VehicleEnvelopeDto {
  @ApiProperty({ type: VehicleResponseDto }) data!: VehicleResponseDto;
}

export class RegisterVehicleMetaDto {
  @ApiProperty({
    description: 'false si la placa ya era del mismo cliente y se actualizó/reactivó',
  })
  created!: boolean;
}

export class RegisterVehicleResponseDto extends VehicleEnvelopeDto {
  @ApiProperty({ type: RegisterVehicleMetaDto }) meta!: RegisterVehicleMetaDto;
}
