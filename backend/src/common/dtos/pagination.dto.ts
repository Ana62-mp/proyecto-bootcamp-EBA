import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 10 }) pageSize!: number;
  @ApiProperty({ example: 42 }) totalItems!: number;
  @ApiProperty({ example: 5 }) totalPages!: number;
}

export class ErrorDetailDto {
  @ApiPropertyOptional({ example: 'telefono' }) field?: string;
  @ApiProperty({ example: 'El número debe tener entre 9 y 10 dígitos.' }) message!: string;
}

export class ErrorContentDto {
  @ApiProperty({ example: 'INVALID_INPUT' }) code!: string;
  @ApiProperty({ example: 'Datos de entrada inválidos.' }) message!: string;
  @ApiProperty({ type: [ErrorDetailDto] }) details!: ErrorDetailDto[];
}

export class ErrorResponseDto {
  @ApiProperty({ type: ErrorContentDto }) error!: ErrorContentDto;
}
