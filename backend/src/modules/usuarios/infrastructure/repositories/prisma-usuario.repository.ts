import { Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { paginate, Paginated } from '../../../../common/interfaces/paginated.interface';
import { isUniqueViolation } from '../../../../context/database/prisma-errors';
import { PrismaService } from '../../../../context/database/prisma.service';
import { Prisma, Usuario } from '../../../../generated/prisma/client';
import type { UsuarioRepositoryPort } from '../../domain/interfaces/usuario-repository.port';
import {
  ActualizarUsuarioData,
  CrearUsuarioData,
  NumeroEstacion,
  UsuarioConPassword,
  UsuarioFilters,
  UsuarioRecord,
} from '../../domain/types/usuario.types';

function toRecord(row: Usuario): UsuarioRecord {
  return {
    id: row.id,
    usuario: row.usuario,
    nombreVisible: row.nombreVisible,
    rol: row.rol,
    activo: row.activo,
    codigo: row.codigo,
    ubicacion: row.ubicacion,
    estacionPreferida: (row.estacionPreferida as NumeroEstacion | null) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function duplicateUsuario(usuario: string | undefined): AppException {
  return AppException.conflict(
    'USUARIO_DUPLICADO',
    `El nombre de usuario "${usuario ?? ''}" ya está en uso.`,
  );
}

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UsuarioRecord | null> {
    const row = await this.prisma.usuario.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findByUsuarioWithPassword(usuario: string): Promise<UsuarioConPassword | null> {
    const row = await this.prisma.usuario.findUnique({ where: { usuario } });
    return row ? { ...toRecord(row), passwordHash: row.passwordHash } : null;
  }

  async existsByUsuario(usuario: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.usuario.count({
      where: { usuario, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    return count > 0;
  }

  async list(
    filters: UsuarioFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<UsuarioRecord>> {
    const term = filters.searchTerm?.trim();
    const where: Prisma.UsuarioWhereInput = {
      ...(filters.rol ? { rol: filters.rol } : {}),
      ...(filters.activo !== undefined ? { activo: filters.activo } : {}),
      ...(term
        ? {
            OR: [
              { usuario: { contains: term, mode: 'insensitive' } },
              { nombreVisible: { contains: term, mode: 'insensitive' } },
              { codigo: { contains: term, mode: 'insensitive' } },
              { ubicacion: { contains: term, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        orderBy: [{ rol: 'asc' }, { usuario: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.usuario.count({ where }),
    ]);
    return paginate(rows.map(toRecord), total, page, pageSize);
  }

  async create(data: CrearUsuarioData): Promise<UsuarioRecord> {
    try {
      const row = await this.prisma.usuario.create({ data });
      return toRecord(row);
    } catch (error) {
      if (isUniqueViolation(error, 'usuario')) throw duplicateUsuario(data.usuario);
      throw error;
    }
  }

  async update(id: string, data: ActualizarUsuarioData): Promise<UsuarioRecord> {
    try {
      const row = await this.prisma.usuario.update({ where: { id }, data });
      return toRecord(row);
    } catch (error) {
      if (isUniqueViolation(error, 'usuario')) throw duplicateUsuario(data.usuario);
      throw error;
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.usuario.update({ where: { id }, data: { passwordHash } });
  }
}
