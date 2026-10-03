import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationMetaDto, PaginationQueryDto } from '../../../../common/dtos/pagination.dto';
import type { EstadoTurno, TicketRecord } from '../../domain/types/ticket.types';
import { TicketClienteDto, TicketServicioDto, TicketVehiculoDto } from './ticket-response.dto';

const ESTADOS_TURNO: EstadoTurno[] = [
  'EN_ESPERA',
  'LAVANDO',
  'SECANDO_PULIENDO',
  'LISTO',
  'ENTREGADO',
  'CANCELADO',
];

export class ListTurnosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Uno o varios estados separados por coma, p. ej. ENTREGADO,CANCELADO',
    example: 'ENTREGADO,CANCELADO',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      : value,
  )
  @IsIn(ESTADOS_TURNO, { each: true })
  estado?: EstadoTurno[];

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  fechaDesde?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  fechaHasta?: string;

  @ApiPropertyOptional({ description: 'Número de turno, placa, cliente o documento' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  searchTerm?: string;
}

export class HistorialEstadoDto {
  @ApiProperty({ enum: ESTADOS_TURNO }) estado!: EstadoTurno;
  @ApiProperty() fecha!: string;
  @ApiProperty({ format: 'uuid', nullable: true, type: String }) usuarioId!: string | null;
}

export class LavadorDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Carlos Mendoza' }) nombre!: string;
}

/** Vista operativa completa (ADMIN y LAVADOR). */
export class TurnoResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'CW-20261003-0001' }) numeroTurno!: string;
  @ApiProperty() emitidoEn!: string;
  @ApiProperty({ format: 'uuid' }) machineId!: string;
  @ApiProperty({ enum: ESTADOS_TURNO }) estadoTurno!: EstadoTurno;
  @ApiProperty({ enum: [1, 2], nullable: true }) numeroEstacion!: 1 | 2 | null;
  @ApiProperty({ example: '10.00' }) precio!: string;
  @ApiProperty({ example: 'USD' }) moneda!: string;
  @ApiProperty({ type: TicketClienteDto }) cliente!: TicketClienteDto;
  @ApiProperty({ type: TicketVehiculoDto }) vehiculo!: TicketVehiculoDto;
  @ApiProperty({ type: TicketServicioDto }) servicio!: TicketServicioDto;
  @ApiProperty({ type: LavadorDto, nullable: true }) lavador!: LavadorDto | null;
  @ApiProperty({ nullable: true, type: String }) fechaInicioLavado!: string | null;
  @ApiProperty({ nullable: true, type: String }) fechaFinalizacion!: string | null;
  @ApiProperty({ nullable: true, type: String }) fechaEntrega!: string | null;
  @ApiProperty({ type: [HistorialEstadoDto] }) historial!: HistorialEstadoDto[];

  static from(t: TicketRecord): TurnoResponseDto {
    return {
      id: t.id,
      numeroTurno: t.numeroTurno,
      emitidoEn: t.emitidoEn.toISOString(),
      machineId: t.machineId,
      estadoTurno: t.estadoTurno,
      numeroEstacion: t.numeroEstacion,
      precio: t.precio,
      moneda: t.moneda,
      cliente: {
        id: t.clienteId,
        nombre: t.clienteNombre,
        tipoDocumento: t.clienteTipoDocumento,
        numeroDocumento: t.clienteNumeroDocumento,
      },
      vehiculo: {
        id: t.vehiculoId,
        placa: t.vehiculoPlaca,
        marca: t.vehiculoMarca,
        modelo: t.vehiculoModelo,
        color: t.vehiculoColor,
        tipoVehiculo: t.vehiculoTipo,
      },
      servicio: { id: t.servicioId, nombre: t.servicioNombre, precio: t.precio, moneda: t.moneda },
      lavador: t.lavadorId ? { id: t.lavadorId, nombre: t.lavadorNombre ?? '' } : null,
      fechaInicioLavado: t.fechaInicioLavado?.toISOString() ?? null,
      fechaFinalizacion: t.fechaFinalizacion?.toISOString() ?? null,
      fechaEntrega: t.fechaEntrega?.toISOString() ?? null,
      historial: t.historial.map((h) => ({
        estado: h.estado,
        fecha: h.fecha.toISOString(),
        usuarioId: h.usuarioId,
      })),
    };
  }
}

/** Vista de cola sin datos personales (máquinas y monitor público). */
export class TurnoPublicoDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'CW-20261003-0001' }) numeroTurno!: string;
  @ApiProperty({ example: 'PBH4321' }) placa!: string;
  @ApiProperty({ example: 'Chevrolet' }) marca!: string;
  @ApiProperty({ example: 'Sail' }) modelo!: string;
  @ApiProperty({ example: 'Plata' }) color!: string;
  @ApiProperty({ example: 'Lavado completo' }) servicioNombre!: string;
  @ApiProperty({ enum: ESTADOS_TURNO }) estadoTurno!: EstadoTurno;
  @ApiProperty({ enum: [1, 2], nullable: true }) numeroEstacion!: 1 | 2 | null;
  @ApiProperty() emitidoEn!: string;
  @ApiProperty({ nullable: true, type: String }) fechaInicioLavado!: string | null;
  @ApiProperty({ nullable: true, type: String }) fechaFinalizacion!: string | null;

  static from(t: TicketRecord): TurnoPublicoDto {
    return {
      id: t.id,
      numeroTurno: t.numeroTurno,
      placa: t.vehiculoPlaca,
      marca: t.vehiculoMarca,
      modelo: t.vehiculoModelo,
      color: t.vehiculoColor,
      servicioNombre: t.servicioNombre,
      estadoTurno: t.estadoTurno,
      numeroEstacion: t.numeroEstacion,
      emitidoEn: t.emitidoEn.toISOString(),
      fechaInicioLavado: t.fechaInicioLavado?.toISOString() ?? null,
      fechaFinalizacion: t.fechaFinalizacion?.toISOString() ?? null,
    };
  }
}

export class TurnoEnvelopeDto {
  @ApiProperty({ type: TurnoResponseDto }) data!: TurnoResponseDto;
}

export class TurnosPageDto {
  @ApiProperty({ type: [TurnoResponseDto] }) data!: TurnoResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class ColaPublicaDto {
  @ApiProperty({ type: [TurnoPublicoDto] }) data!: TurnoPublicoDto[];
}

export class AvanzarTurnoMetaDto {
  @ApiProperty({
    type: [TurnoResponseDto],
    description: 'Turnos asignados al liberarse la estación',
  })
  asignados!: TurnoResponseDto[];
}

export class AvanzarTurnoResponseDto extends TurnoEnvelopeDto {
  @ApiProperty({ type: AvanzarTurnoMetaDto }) meta!: AvanzarTurnoMetaDto;
}

export class TurnosListDto {
  @ApiProperty({ type: [TurnoResponseDto] }) data!: TurnoResponseDto[];
}
