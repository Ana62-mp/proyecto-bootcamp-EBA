import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UsuarioResponseDto } from '../../../usuarios/api/dtos/usuario.dto';

export class LoginDto {
  @ApiProperty({ example: 'kiosk01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  usuario!: string;

  @ApiProperty({ example: 'kiosk123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}

export class SessionDto {
  @ApiProperty({ description: 'Access token JWT; guardarlo solo en memoria.' })
  accessToken!: string;

  @ApiProperty({ example: 28800, description: 'Segundos de validez del access token.' })
  expiresIn!: number;

  @ApiProperty({ type: UsuarioResponseDto })
  user!: UsuarioResponseDto;
}

export class SessionEnvelopeDto {
  @ApiProperty({ type: SessionDto }) data!: SessionDto;
}
