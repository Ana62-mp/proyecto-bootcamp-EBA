import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationMetaDto, PaginationQueryDto } from '../../../../common/dtos/pagination.dto';
import { UsuarioRecord } from '../../domain/types/usuario.types';

const ROLES = ['ADMIN', 'MAQUINA', 'LAVADOR'] as const;
const USUARIO_REGEX = /^[a-zA-Z0-9._-]{3,50}$/;
const USUARIO_MESSAGE =
  'El usuario debe tener de 3 a 50 caracteres: letras, números, punto, guion o guion bajo.';

const toBool = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;
const emptyToNull = ({ value }: { value: unknown }) => (value === '' ? null : value);

export class ListUsuariosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca en usuario, nombre, código y ubicación' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  searchTerm?: string;

  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  rol?: (typeof ROLES)[number];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  activo?: boolean;
}

export class CreateUsuarioDto {
  @ApiProperty({ example: 'kiosk03' })
  @Matches(USUARIO_REGEX, { message: USUARIO_MESSAGE })
  usuario!: string;

  @ApiProperty({ example: 'Kiosko Autoservicio 03' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombreVisible!: string;

  @ApiProperty({ enum: ['MAQUINA', 'LAVADOR'] })
  @IsIn(['MAQUINA', 'LAVADOR'], { message: 'Solo se pueden crear usuarios MAQUINA o LAVADOR.' })
  rol!: 'MAQUINA' | 'LAVADOR';

  @ApiProperty({ example: 'temporal123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  passwordTemporal!: string;

  @ApiPropertyOptional({ example: 'KIOSK-03', nullable: true })
  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(30)
  codigo?: string | null;

  @ApiPropertyOptional({ example: 'Entrada Este - Carril 3', nullable: true })
  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(120)
  ubicacion?: string | null;

  @ApiPropertyOptional({ enum: [1, 2], nullable: true })
  @IsOptional()
  @IsIn([1, 2, null])
  estacionPreferida?: 1 | 2 | null;
}

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'kiosk03' })
  @IsOptional()
  @Matches(USUARIO_REGEX, { message: USUARIO_MESSAGE })
  usuario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombreVisible?: string;

  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  rol?: (typeof ROLES)[number];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(30)
  codigo?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(120)
  ubicacion?: string | null;

  @ApiPropertyOptional({ enum: [1, 2], nullable: true })
  @IsOptional()
  @IsIn([1, 2, null])
  estacionPreferida?: 1 | 2 | null;
}

export class CambiarEstadoDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  activo!: boolean;
}

export class RestablecerPasswordDto {
  @ApiProperty({ example: 'nuevoTemporal123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  nuevoPasswordTemporal!: string;
}

export class UsuarioResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'kiosk01' }) usuario!: string;
  @ApiProperty({ example: 'Kiosko Autoservicio 01' }) nombreVisible!: string;
  @ApiProperty({ enum: ROLES }) rol!: string;
  @ApiProperty() activo!: boolean;
  @ApiProperty({ nullable: true, type: String, example: 'KIOSK-01' }) codigo!: string | null;
  @ApiProperty({ nullable: true, type: String }) ubicacion!: string | null;
  @ApiProperty({ nullable: true, enum: [1, 2] }) estacionPreferida!: 1 | 2 | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static from(record: UsuarioRecord): UsuarioResponseDto {
    return {
      id: record.id,
      usuario: record.usuario,
      nombreVisible: record.nombreVisible,
      rol: record.rol,
      activo: record.activo,
      codigo: record.codigo,
      ubicacion: record.ubicacion,
      estacionPreferida: record.estacionPreferida,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

export class UsuarioEnvelopeDto {
  @ApiProperty({ type: UsuarioResponseDto }) data!: UsuarioResponseDto;
}

export class UsuariosPageDto {
  @ApiProperty({ type: [UsuarioResponseDto] }) data!: UsuarioResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
