import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LookupVehicleQueryDto {
  @ApiProperty({
    example: 'PBH1234',
    description: 'Placa: ABC1234, ABC-1234, IA7000 o IA-7000. Se valida otra vez en el backend.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  licensePlate!: string;
}
