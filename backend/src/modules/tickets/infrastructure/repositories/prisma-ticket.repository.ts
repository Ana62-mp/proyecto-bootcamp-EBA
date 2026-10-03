import { Injectable } from '@nestjs/common';
import { paginate, Paginated } from '../../../../common/interfaces/paginated.interface';
import { dateOnlyToDate } from '../../../../common/utils/timezone';
import { isUniqueViolation, PrismaTx } from '../../../../context/database/prisma-errors';
import { PrismaService } from '../../../../context/database/prisma.service';
import { Prisma } from '../../../../generated/prisma/client';
import type {
  TicketRepositoryPort,
  TicketTransactionPort,
} from '../../domain/interfaces/ticket-repository.port';
import {
  ClienteParaTicket,
  DuplicateIdempotencyKeyError,
  ESTADOS_ACTIVOS,
  ESTADOS_EN_ESTACION,
  EstadoTurno,
  NewTicketData,
  NumeroEstacion,
  ServicioParaTicket,
  TicketFilters,
  TicketRecord,
  TurnoChanges,
  VehiculoParaTicket,
} from '../../domain/types/ticket.types';

/** Clave del advisory lock que serializa operaciones de turnos y estaciones. */
const TURNOS_LOCK_KEY = 7_240_011;
const GUAYAQUIL_OFFSET = '-05:00';

const include = {
  historial: { orderBy: { fecha: 'asc' } },
  lavador: { select: { nombreVisible: true } },
} satisfies Prisma.TicketInclude;

type TicketRow = Prisma.TicketGetPayload<{ include: typeof include }>;

function toRecord(row: TicketRow): TicketRecord {
  return {
    id: row.id,
    numeroTurno: row.numeroTurno,
    emitidoEn: row.emitidoEn,
    machineId: row.machineId,
    emitidoPorId: row.emitidoPorId,
    idempotencyKey: row.idempotencyKey,
    requestFingerprint: row.requestFingerprint,
    clienteId: row.clienteId,
    vehiculoId: row.vehiculoId,
    servicioId: row.servicioId,
    precio: row.precio.toFixed(2),
    moneda: row.moneda,
    servicioNombre: row.servicioNombre,
    clienteNombre: row.clienteNombre,
    clienteTipoDocumento: row.clienteTipoDocumento,
    clienteNumeroDocumento: row.clienteNumeroDocumento,
    vehiculoPlaca: row.vehiculoPlaca,
    vehiculoMarca: row.vehiculoMarca,
    vehiculoModelo: row.vehiculoModelo,
    vehiculoColor: row.vehiculoColor,
    vehiculoTipo: row.vehiculoTipo,
    estadoTurno: row.estadoTurno,
    numeroEstacion: (row.numeroEstacion as NumeroEstacion | null) ?? null,
    lavadorId: row.lavadorId,
    lavadorNombre: row.lavador?.nombreVisible ?? null,
    fechaInicioLavado: row.fechaInicioLavado,
    fechaFinalizacion: row.fechaFinalizacion,
    fechaEntrega: row.fechaEntrega,
    historial: row.historial.map((h) => ({
      estado: h.estado,
      fecha: h.fecha,
      usuarioId: h.usuarioId,
    })),
  };
}

class PrismaTicketTransaction implements TicketTransactionPort {
  constructor(private readonly tx: PrismaTx) {}

  async lockTurnos(): Promise<void> {
    await this.tx.$queryRaw`SELECT 1 AS ok FROM pg_advisory_xact_lock(${TURNOS_LOCK_KEY}::bigint)`;
  }

  async findByIdempotencyKey(
    actorId: string,
    idempotencyKey: string,
  ): Promise<TicketRecord | null> {
    const row = await this.tx.ticket.findUnique({
      where: { emitidoPorId_idempotencyKey: { emitidoPorId: actorId, idempotencyKey } },
      include,
    });
    return row ? toRecord(row) : null;
  }

  async findById(id: string): Promise<TicketRecord | null> {
    const row = await this.tx.ticket.findUnique({ where: { id }, include });
    return row ? toRecord(row) : null;
  }

  findCliente(id: string): Promise<ClienteParaTicket | null> {
    return this.tx.cliente.findUnique({
      where: { id },
      select: {
        id: true,
        activo: true,
        tipoDocumento: true,
        numeroDocumento: true,
        nombres: true,
        apellidos: true,
        razonSocial: true,
      },
    });
  }

  findVehiculo(id: string): Promise<VehiculoParaTicket | null> {
    return this.tx.vehiculo.findUnique({
      where: { id },
      select: {
        id: true,
        clienteId: true,
        activo: true,
        placa: true,
        marca: true,
        modelo: true,
        color: true,
        tipoVehiculo: true,
      },
    });
  }

  async findServicio(id: string): Promise<ServicioParaTicket | null> {
    const row = await this.tx.servicioLavado.findUnique({ where: { id } });
    return row
      ? {
          id: row.id,
          activo: row.activo,
          nombre: row.nombre,
          precio: row.precio.toFixed(2),
          moneda: row.moneda,
        }
      : null;
  }

  async vehicleHasActiveTurn(vehiculoId: string): Promise<boolean> {
    const count = await this.tx.ticket.count({
      where: { vehiculoId, estadoTurno: { in: [...ESTADOS_ACTIVOS] } },
    });
    return count > 0;
  }

  async nextSequence(fechaTurno: string): Promise<number> {
    const rows = await this.tx.$queryRaw<Array<{ ultimo: number }>>`
      INSERT INTO turno_counters (fecha, ultimo)
      VALUES (${dateOnlyToDate(fechaTurno)}::date, 1)
      ON CONFLICT (fecha) DO UPDATE SET ultimo = turno_counters.ultimo + 1
      RETURNING ultimo`;
    return Number(rows[0].ultimo);
  }

  async createTicket(data: NewTicketData): Promise<string> {
    try {
      const row = await this.tx.ticket.create({
        data: {
          ...data,
          fechaTurno: dateOnlyToDate(data.fechaTurno),
          precio: new Prisma.Decimal(data.precio),
          estadoTurno: 'EN_ESPERA',
          historial: {
            create: { estado: 'EN_ESPERA', fecha: data.emitidoEn, usuarioId: data.emitidoPorId },
          },
        },
        select: { id: true },
      });
      return row.id;
    } catch (error) {
      if (
        isUniqueViolation(error, 'idempotency_key') ||
        isUniqueViolation(error, 'idempotencyKey')
      ) {
        throw new DuplicateIdempotencyKeyError();
      }
      throw error;
    }
  }

  async occupiedStations(): Promise<NumeroEstacion[]> {
    const rows = await this.tx.ticket.findMany({
      where: { estadoTurno: { in: [...ESTADOS_EN_ESTACION] }, numeroEstacion: { not: null } },
      select: { numeroEstacion: true },
    });
    return rows.map((r) => r.numeroEstacion as NumeroEstacion);
  }

  async pendingFifo(limit: number): Promise<string[]> {
    const rows = await this.tx.ticket.findMany({
      where: { estadoTurno: 'EN_ESPERA' },
      orderBy: [{ emitidoEn: 'asc' }, { numeroTurno: 'asc' }],
      take: limit,
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async updateTurno(
    id: string,
    changes: TurnoChanges,
    historial: { estado: EstadoTurno; fecha: Date; usuarioId: string | null },
  ): Promise<void> {
    await this.tx.ticket.update({
      where: { id },
      data: { ...changes, historial: { create: historial } },
    });
  }
}

@Injectable()
export class PrismaTicketRepository implements TicketRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  runInTransaction<T>(work: (tx: TicketTransactionPort) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => work(new PrismaTicketTransaction(tx)), {
      maxWait: 10_000,
      timeout: 15_000,
    });
  }

  async findByIdempotencyKey(
    actorId: string,
    idempotencyKey: string,
  ): Promise<TicketRecord | null> {
    const row = await this.prisma.ticket.findUnique({
      where: { emitidoPorId_idempotencyKey: { emitidoPorId: actorId, idempotencyKey } },
      include,
    });
    return row ? toRecord(row) : null;
  }

  async findById(id: string): Promise<TicketRecord | null> {
    const row = await this.prisma.ticket.findUnique({ where: { id }, include });
    return row ? toRecord(row) : null;
  }

  async list(
    filters: TicketFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<TicketRecord>> {
    const term = filters.searchTerm?.trim();
    const emitidoEn: Prisma.DateTimeFilter = {};
    if (filters.fechaDesde)
      emitidoEn.gte = new Date(`${filters.fechaDesde}T00:00:00${GUAYAQUIL_OFFSET}`);
    if (filters.fechaHasta)
      emitidoEn.lte = new Date(`${filters.fechaHasta}T23:59:59.999${GUAYAQUIL_OFFSET}`);

    const where: Prisma.TicketWhereInput = {
      ...(filters.estados?.length ? { estadoTurno: { in: filters.estados } } : {}),
      ...(emitidoEn.gte || emitidoEn.lte ? { emitidoEn } : {}),
      ...(term
        ? {
            OR: [
              { numeroTurno: { contains: term, mode: 'insensitive' } },
              { vehiculoPlaca: { contains: term.replace(/-/g, ''), mode: 'insensitive' } },
              { clienteNombre: { contains: term, mode: 'insensitive' } },
              { clienteNumeroDocumento: { contains: term } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        include,
        orderBy: { emitidoEn: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return paginate(rows.map(toRecord), total, page, pageSize);
  }

  async listActive(): Promise<TicketRecord[]> {
    const rows = await this.prisma.ticket.findMany({
      where: { estadoTurno: { in: [...ESTADOS_ACTIVOS] } },
      include,
      orderBy: [{ emitidoEn: 'asc' }, { numeroTurno: 'asc' }],
    });
    return rows.map(toRecord);
  }
}
