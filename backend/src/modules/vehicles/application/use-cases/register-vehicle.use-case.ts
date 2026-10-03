import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../../../common/errors/app.exception';
import { normalizeRegistrationPlate } from '../../domain/plate';
import { VEHICLE_REPOSITORY } from '../../domain/interfaces/vehicle-repository.port';
import type { VehicleRepositoryPort } from '../../domain/interfaces/vehicle-repository.port';
import { VehicleLookupSnapshot } from '../../domain/types/vehicle-lookup.types';
import {
  CreateVehicleData,
  PlateAlreadyRegisteredError,
  TipoVehiculo,
  VehicleRecord,
} from '../../domain/types/vehicle.types';

export interface RegisterVehicleCommand {
  clienteId: string;
  placa: string;
  tipoVehiculo: TipoVehiculo;
  marca: string;
  modelo: string;
  color: string;
  year?: number | null;
  vehicleClass?: string | null;
  country?: string | null;
  serviceType?: string | null;
}

export interface RegisterVehicleResult {
  vehicle: VehicleRecord;
  created: boolean;
}

const HOUR_MS = 3_600_000;
const clean = (value: string | null | undefined): string | null => value?.trim() || null;

/**
 * Registra (o reactiva) un vehículo asociado explícitamente a un cliente.
 * La procedencia WEBSERVICES_EC se toma de la última consulta hecha por el backend,
 * nunca de datos enviados por el frontend; el registro manual queda como MANUAL.
 */
@Injectable()
export class RegisterVehicleUseCase {
  private readonly snapshotTtlMs: number;

  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepositoryPort,
    config: ConfigService,
  ) {
    this.snapshotTtlMs = config.getOrThrow<number>('VEHICLE_LOOKUP_SNAPSHOT_TTL_HOURS') * HOUR_MS;
  }

  async execute(cmd: RegisterVehicleCommand): Promise<RegisterVehicleResult> {
    const placa = normalizeRegistrationPlate(cmd.placa);
    if (!placa) {
      throw AppException.badRequest(
        'INVALID_LICENSE_PLATE',
        'Formato de placa inválido. Ejemplos: ABC-1234, ABC-123 o IA-7000.',
        [{ field: 'placa', message: 'Formato de placa no permitido.' }],
      );
    }

    const cliente = await this.vehicles.findClienteActivo(cmd.clienteId);
    if (!cliente)
      throw AppException.notFound('CLIENTE_NO_ENCONTRADO', 'El cliente seleccionado no existe.');
    if (!cliente.activo)
      throw AppException.conflict('CLIENTE_INACTIVO', 'El cliente se encuentra desactivado.');

    const snapshot = await this.vehicles.findLookupSnapshot(
      placa,
      new Date(Date.now() - this.snapshotTtlMs),
    );

    const existing = await this.vehicles.findByPlaca(placa);
    if (existing) return this.resolveExisting(existing, cmd, snapshot);

    try {
      return {
        vehicle: await this.vehicles.create(this.buildData(placa, cmd, snapshot)),
        created: true,
      };
    } catch (error) {
      if (!(error instanceof PlateAlreadyRegisteredError)) throw error;
      // Otra petición registró la placa en paralelo: verificar a qué cliente pertenece.
      const concurrent = await this.vehicles.findByPlaca(placa);
      if (!concurrent) throw error;
      return this.resolveExisting(concurrent, cmd, snapshot);
    }
  }

  private async resolveExisting(
    existing: VehicleRecord,
    cmd: RegisterVehicleCommand,
    snapshot: VehicleLookupSnapshot | null,
  ): Promise<RegisterVehicleResult> {
    if (existing.clienteId !== cmd.clienteId) {
      throw AppException.conflict(
        'PLACA_REGISTRADA_OTRO_CLIENTE',
        'Esta placa ya se encuentra registrada. Solicita asistencia al personal.',
      );
    }
    const {
      clienteId: _c,
      placa: _p,
      ...data
    } = this.buildData(existing.placa, cmd, snapshot, existing);
    const vehicle = await this.vehicles.update(existing.id, { ...data, activo: true });
    return { vehicle, created: false };
  }

  private buildData(
    placa: string,
    cmd: RegisterVehicleCommand,
    snapshot: VehicleLookupSnapshot | null,
    existing?: VehicleRecord,
  ): CreateVehicleData {
    const pick = <T>(value: T | null | undefined, fallback: T | null): T | null =>
      value !== undefined && value !== null ? value : fallback;

    const base = {
      clienteId: cmd.clienteId,
      placa,
      tipoVehiculo: cmd.tipoVehiculo,
      marca: cmd.marca.trim(),
      modelo: cmd.modelo.trim(),
      color: cmd.color.trim(),
    };

    if (snapshot) {
      return {
        ...base,
        year: pick(cmd.year, snapshot.year),
        vehicleClass: pick(clean(cmd.vehicleClass), snapshot.vehicleClass),
        country: pick(clean(cmd.country), snapshot.country),
        serviceType: pick(clean(cmd.serviceType), snapshot.serviceType),
        providerVehicleId: snapshot.providerVehicleId,
        registrationDate: snapshot.registrationDate,
        registrationExpiryDate: snapshot.registrationExpiryDate,
        providerAutoYear: snapshot.providerAutoYear,
        chassis: snapshot.chassis,
        engineNumber: snapshot.engineNumber,
        dataSource: 'WEBSERVICES_EC',
        providerQueriedAt: snapshot.queriedAt,
      };
    }

    // Sin consulta reciente: se conservan datos verificados previos, si existen.
    return {
      ...base,
      year: pick(cmd.year, existing?.year ?? null),
      vehicleClass: pick(clean(cmd.vehicleClass), existing?.vehicleClass ?? null),
      country: pick(clean(cmd.country), existing?.country ?? null),
      serviceType: pick(clean(cmd.serviceType), existing?.serviceType ?? null),
      providerVehicleId: existing?.providerVehicleId ?? null,
      registrationDate: existing?.registrationDate ?? null,
      registrationExpiryDate: existing?.registrationExpiryDate ?? null,
      providerAutoYear: existing?.providerAutoYear ?? null,
      chassis: existing?.chassis ?? null,
      engineNumber: existing?.engineNumber ?? null,
      dataSource: existing?.dataSource ?? 'MANUAL',
      providerQueriedAt: existing?.providerQueriedAt ?? null,
    };
  }
}
