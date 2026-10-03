import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ServicioRecord } from '../../domain/types/servicio.types';

export class ListServiciosQueryDto {
  @ApiPropertyOptional({ description: 'Solo ADMIN: incluir servicios inactivos', default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  incluirInactivos: boolean = false;
}

export class ServicioResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['LAVADO_SIMPLE', 'LAVADO_COMPLETO', 'LAVADO_TAPICERIA', 'PARAFINADO'] })
  codigo!: string;
  @ApiProperty({ example: 'Lavado completo' }) nombre!: string;
  @ApiProperty() descripcion!: string;
  @ApiProperty({ example: '10.00', description: 'Decimal serializado como string' })
  precio!: string;
  @ApiProperty({ example: 'USD' }) moneda!: string;
  @ApiProperty() activo!: boolean;

  static from(record: ServicioRecord): ServicioResponseDto {
    return { ...record };
  }
}

export class ServiciosListDto {
  @ApiProperty({ type: [ServicioResponseDto] }) data!: ServicioResponseDto[];
}

export class ServicioEnvelopeDto {
  @ApiProperty({ type: ServicioResponseDto }) data!: ServicioResponseDto;
}
