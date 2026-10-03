import { Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { paginate, Paginated } from '../../../../common/interfaces/paginated.interface';
import { isUniqueViolation } from '../../../../context/database/prisma-errors';
import { PrismaService } from '../../../../context/database/prisma.service';
import { Cliente, Prisma, Vehiculo } from '../../../../generated/prisma/client';
import type { ClienteRepositoryPort } from '../../domain/interfaces/cliente-repository.port';
import {
  ClienteData,
  ClienteFilters,
  ClienteRecord,
  TipoDocumento,
} from '../../domain/types/cliente.types';

const ACTIVE_STATES = ['EN_ESPERA', 'LAVANDO', 'SECANDO_PULIENDO', 'LISTO'] as const;
// Ecuador continental: UTC-5 sin horario de verano.
const GUAYAQUIL_OFFSET = '-05:00';

type ClienteConVehiculos = Cliente & { vehiculos: Vehiculo[] };

function toRecord(row: ClienteConVehiculos): ClienteRecord {
  return {
    id: row.id,
    tipoDocumento: row.tipoDocumento,
    numeroDocumento: row.numeroDocumento,
    nombres: row.nombres,
    apellidos: row.apellidos,
    razonSocial: row.razonSocial,
    nombreContacto: row.nombreContacto,
    telefono: row.telefono,
    correo: row.correo,
    activo: row.activo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    vehiculos: row.vehiculos.map((v) => ({
      id: v.id,
      clienteId: v.clienteId,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      color: v.color,
      tipoVehiculo: v.tipoVehiculo,
      activo: v.activo,
    })),
  };
}

const include = { vehiculos: { orderBy: { createdAt: 'asc' } } } satisfies Prisma.ClienteInclude;

function duplicateDocumento(numero?: string): AppException {
  return AppException.conflict(
    'CLIENTE_DUPLICADO',
    `Ya existe un cliente registrado con el documento ${numero ?? ''}.`.trim(),
  );
}

@Injectable()
export class PrismaClienteRepository implements ClienteRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ClienteRecord | null> {
    const row = await this.prisma.cliente.findUnique({ where: { id }, include });
    return row ? toRecord(row) : null;
  }

  async findByDocumento(tipo: TipoDocumento, numero: string): Promise<ClienteRecord | null> {
    const row = await this.prisma.cliente.findUnique({
      where: { tipoDocumento_numeroDocumento: { tipoDocumento: tipo, numeroDocumento: numero } },
      include,
    });
    return row ? toRecord(row) : null;
  }

  async existsByDocumento(
    tipo: TipoDocumento,
    numero: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.cliente.count({
      where: {
        tipoDocumento: tipo,
        numeroDocumento: numero,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async list(
    filters: ClienteFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<ClienteRecord>> {
    const term = filters.searchTerm?.trim();
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.fechaDesde)
      createdAt.gte = new Date(`${filters.fechaDesde}T00:00:00${GUAYAQUIL_OFFSET}`);
    if (filters.fechaHasta)
      createdAt.lte = new Date(`${filters.fechaHasta}T23:59:59.999${GUAYAQUIL_OFFSET}`);

    const where: Prisma.ClienteWhereInput = {
      ...(filters.tipoDocumento ? { tipoDocumento: filters.tipoDocumento } : {}),
      ...(filters.activo !== undefined ? { activo: filters.activo } : {}),
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
      ...(term
        ? {
            OR: [
              { numeroDocumento: { contains: term, mode: 'insensitive' } },
              { nombres: { contains: term, mode: 'insensitive' } },
              { apellidos: { contains: term, mode: 'insensitive' } },
              { razonSocial: { contains: term, mode: 'insensitive' } },
              { nombreContacto: { contains: term, mode: 'insensitive' } },
              { telefono: { contains: term } },
              {
                vehiculos: {
                  some: { placa: { contains: term.replace(/-/g, ''), mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.cliente.count({ where }),
    ]);
    return paginate(rows.map(toRecord), total, page, pageSize);
  }

  async create(data: ClienteData): Promise<ClienteRecord> {
    try {
      return toRecord(await this.prisma.cliente.create({ data, include }));
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateDocumento(data.numeroDocumento);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<ClienteData> & { activo?: boolean },
  ): Promise<ClienteRecord> {
    try {
      return toRecord(await this.prisma.cliente.update({ where: { id }, data, include }));
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateDocumento(data.numeroDocumento);
      throw error;
    }
  }

  async hasActiveTurn(clienteId: string): Promise<boolean> {
    const count = await this.prisma.ticket.count({
      where: { clienteId, estadoTurno: { in: [...ACTIVE_STATES] } },
    });
    return count > 0;
  }
}
