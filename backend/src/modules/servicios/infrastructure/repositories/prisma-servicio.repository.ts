import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../context/database/prisma.service';
import { ServicioLavado } from '../../../../generated/prisma/client';
import type { ServicioRepositoryPort } from '../../domain/interfaces/servicio-repository.port';
import { ServicioRecord } from '../../domain/types/servicio.types';

function toRecord(row: ServicioLavado): ServicioRecord {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: row.precio.toFixed(2),
    moneda: row.moneda,
    activo: row.activo,
  };
}

@Injectable()
export class PrismaServicioRepository implements ServicioRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async list(soloActivos: boolean): Promise<ServicioRecord[]> {
    const rows = await this.prisma.servicioLavado.findMany({
      where: soloActivos ? { activo: true } : {},
      orderBy: [{ precio: 'asc' }, { nombre: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async findById(id: string): Promise<ServicioRecord | null> {
    const row = await this.prisma.servicioLavado.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }
}
