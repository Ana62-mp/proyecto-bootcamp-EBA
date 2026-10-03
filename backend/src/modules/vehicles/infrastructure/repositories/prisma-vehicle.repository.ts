import { Injectable } from '@nestjs/common';
import { dateOnlyToDate, dateToDateOnly } from '../../../../common/utils/timezone';
import { isUniqueViolation } from '../../../../context/database/prisma-errors';
import { PrismaService } from '../../../../context/database/prisma.service';
import {
  Vehiculo,
  VehicleLookupSnapshot as SnapshotRow,
} from '../../../../generated/prisma/client';
import type { VehicleRepositoryPort } from '../../domain/interfaces/vehicle-repository.port';
import { VehicleLookupSnapshot } from '../../domain/types/vehicle-lookup.types';
import {
  CreateVehicleData,
  PlateAlreadyRegisteredError,
  UpdateVehicleData,
  VehicleRecord,
} from '../../domain/types/vehicle.types';

const ACTIVE_STATES = ['EN_ESPERA', 'LAVANDO', 'SECANDO_PULIENDO', 'LISTO'] as const;

const toDbDate = (value: string | null | undefined): Date | null | undefined =>
  value === undefined ? undefined : value === null ? null : dateOnlyToDate(value);

function toRecord(row: Vehiculo): VehicleRecord {
  return {
    id: row.id,
    clienteId: row.clienteId,
    placa: row.placa,
    tipoVehiculo: row.tipoVehiculo,
    marca: row.marca,
    modelo: row.modelo,
    color: row.color,
    activo: row.activo,
    providerVehicleId: row.providerVehicleId,
    vehicleClass: row.vehicleClass,
    year: row.year,
    country: row.country,
    serviceType: row.serviceType,
    registrationDate: dateToDateOnly(row.registrationDate),
    registrationExpiryDate: dateToDateOnly(row.registrationExpiryDate),
    providerAutoYear: row.providerAutoYear,
    chassis: row.chassis,
    engineNumber: row.engineNumber,
    dataSource: row.dataSource,
    providerQueriedAt: row.providerQueriedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function snapshotFromRow(row: SnapshotRow): VehicleLookupSnapshot {
  return {
    licensePlate: row.placa,
    providerVehicleId: row.providerVehicleId,
    vehicleClass: row.vehicleClass,
    brand: row.brand,
    model: row.model,
    year: row.year,
    country: row.country,
    color: row.color,
    serviceType: row.serviceType,
    registrationDate: dateToDateOnly(row.registrationDate),
    registrationExpiryDate: dateToDateOnly(row.registrationExpiryDate),
    providerAutoYear: row.providerAutoYear,
    chassis: row.chassis,
    engineNumber: row.engineNumber,
    queriedAt: row.queriedAt,
  };
}

@Injectable()
export class PrismaVehicleRepository implements VehicleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<VehicleRecord | null> {
    const row = await this.prisma.vehiculo.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findByPlaca(placa: string): Promise<VehicleRecord | null> {
    const row = await this.prisma.vehiculo.findUnique({ where: { placa } });
    return row ? toRecord(row) : null;
  }

  async create(data: CreateVehicleData): Promise<VehicleRecord> {
    try {
      const row = await this.prisma.vehiculo.create({
        data: {
          ...data,
          registrationDate: toDbDate(data.registrationDate),
          registrationExpiryDate: toDbDate(data.registrationExpiryDate),
        },
      });
      return toRecord(row);
    } catch (error) {
      if (isUniqueViolation(error, 'placa')) throw new PlateAlreadyRegisteredError();
      throw error;
    }
  }

  async update(id: string, data: UpdateVehicleData): Promise<VehicleRecord> {
    const row = await this.prisma.vehiculo.update({
      where: { id },
      data: {
        ...data,
        registrationDate: toDbDate(data.registrationDate),
        registrationExpiryDate: toDbDate(data.registrationExpiryDate),
      },
    });
    return toRecord(row);
  }

  async findClienteActivo(clienteId: string): Promise<{ activo: boolean } | null> {
    return this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { activo: true } });
  }

  async hasActiveTurn(vehiculoId: string): Promise<boolean> {
    const count = await this.prisma.ticket.count({
      where: { vehiculoId, estadoTurno: { in: [...ACTIVE_STATES] } },
    });
    return count > 0;
  }

  async saveLookupSnapshot(snapshot: VehicleLookupSnapshot): Promise<void> {
    const { licensePlate, ...rest } = snapshot;
    const data = {
      ...rest,
      registrationDate: toDbDate(rest.registrationDate),
      registrationExpiryDate: toDbDate(rest.registrationExpiryDate),
    };
    await this.prisma.vehicleLookupSnapshot.upsert({
      where: { placa: licensePlate },
      create: { placa: licensePlate, ...data },
      update: data,
    });
  }

  async findLookupSnapshot(placa: string, notBefore: Date): Promise<VehicleLookupSnapshot | null> {
    const row = await this.prisma.vehicleLookupSnapshot.findFirst({
      where: { placa, queriedAt: { gte: notBefore } },
    });
    return row ? snapshotFromRow(row) : null;
  }
}
