import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class EmitirTicketDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clienteId!: string;

  @ApiProperty({ format: 'uuid', description: 'Vehículo ya registrado y asociado al cliente' })
  @IsUUID()
  vehiculoId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  servicioLavadoId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Solo ADMIN: máquina destino. Una máquina autenticada usa su propia identidad.',
  })
  @IsOptional()
  @IsUUID()
  machineId?: string;
}
