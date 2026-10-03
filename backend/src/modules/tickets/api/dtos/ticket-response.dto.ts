import { ApiProperty } from '@nestjs/swagger';
import { TicketComprobante, toComprobante } from '../../domain/types/ticket-comprobante.types';
import { TicketRecord } from '../../domain/types/ticket.types';

const ESTADOS_TURNO = [
  'EN_ESPERA',
  'LAVANDO',
  'SECANDO_PULIENDO',
  'LISTO',
  'ENTREGADO',
  'CANCELADO',
];

export class TicketClienteDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Cliente de ejemplo' }) nombre!: string;
  @ApiProperty({ enum: ['CEDULA', 'PASAPORTE', 'RUC'] }) tipoDocumento!:
    'CEDULA' | 'PASAPORTE' | 'RUC';
  @ApiProperty({ example: 'documento-del-cliente' }) numeroDocumento!: string;
}

export class TicketVehiculoDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'ABC1234' }) placa!: string;
  @ApiProperty({ example: 'Ejemplo' }) marca!: string;
  @ApiProperty({ example: 'Ejemplo' }) modelo!: string;
  @ApiProperty({ example: 'Blanco' }) color!: string;
  @ApiProperty({ enum: ['AUTOMOVIL', 'SUV', 'CAMIONETA', 'OTRO'] })
  tipoVehiculo!: 'AUTOMOVIL' | 'SUV' | 'CAMIONETA' | 'OTRO';
}

export class TicketServicioDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Lavado completo' }) nombre!: string;
  @ApiProperty({ example: '10.00', description: 'Decimal como string' }) precio!: string;
  @ApiProperty({ example: 'USD' }) moneda!: string;
}

/** `data` de la emisión y `ticket` del evento Socket.IO `ticket:emitido`. */
export class TicketResponseDto implements TicketComprobante {
  @ApiProperty({ format: 'uuid' }) ticketId!: string;
  @ApiProperty({ example: 'CW-20261003-0001' }) numeroTurno!: string;
  @ApiProperty({ example: '2026-10-03T19:00:00.000Z', description: 'ISO 8601 UTC' })
  emitidoEn!: string;
  @ApiProperty({
    enum: ['EMITIDO', 'ANULADO'],
    description: 'Estado del comprobante; no implica pago',
  })
  estado!: 'EMITIDO' | 'ANULADO';
  @ApiProperty({ enum: ['PENDIENTE'] }) estadoPago!: 'PENDIENTE';
  @ApiProperty({ enum: ESTADOS_TURNO }) estadoTurno!: TicketComprobante['estadoTurno'];
  @ApiProperty({ enum: [1, 2], nullable: true }) numeroEstacion!: 1 | 2 | null;
  @ApiProperty({ type: TicketClienteDto }) cliente!: TicketClienteDto;
  @ApiProperty({ type: TicketVehiculoDto }) vehiculo!: TicketVehiculoDto;
  @ApiProperty({ type: TicketServicioDto }) servicio!: TicketServicioDto;
  @ApiProperty({ example: 'Después de pagar, diríjase al parqueadero.' }) mensaje!: string;

  static from(record: TicketRecord): TicketResponseDto {
    return toComprobante(record);
  }
}

export class TicketEmisionMetaDto {
  @ApiProperty({ format: 'uuid', description: 'Idempotency-Key de la petición' })
  requestId!: string;
  @ApiProperty({ description: 'true si se devolvió una emisión previa (HTTP 200)' })
  replayed!: boolean;
}

export class TicketEmisionResponseDto {
  @ApiProperty({ type: TicketResponseDto }) data!: TicketResponseDto;
  @ApiProperty({ type: TicketEmisionMetaDto }) meta!: TicketEmisionMetaDto;
}

export class TicketEnvelopeDto {
  @ApiProperty({ type: TicketResponseDto }) data!: TicketResponseDto;
}
