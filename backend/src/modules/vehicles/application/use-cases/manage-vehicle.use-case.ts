import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { VEHICLE_REPOSITORY } from '../../domain/interfaces/vehicle-repository.port';
import type { VehicleRepositoryPort } from '../../domain/interfaces/vehicle-repository.port';
import { TipoVehiculo, VehicleRecord } from '../../domain/types/vehicle.types';

@Injectable()
export class GetVehicleUseCase {
  constructor(@Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepositoryPort) {}

  async execute(id: string): Promise<VehicleRecord> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw AppException.notFound('VEHICULO_NO_ENCONTRADO', 'Vehículo no encontrado.');
    return vehicle;
  }
}

export interface UpdateVehicleCommand {
  tipoVehiculo?: TipoVehiculo;
  marca?: string;
  modelo?: string;
  color?: string;
  activo?: boolean;
  year?: number | null;
  vehicleClass?: string | null;
  country?: string | null;
  serviceType?: string | null;
}

@Injectable()
export class UpdateVehicleUseCase {
  constructor(@Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepositoryPort) {}

  async execute(id: string, cmd: UpdateVehicleCommand): Promise<VehicleRecord> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw AppException.notFound('VEHICULO_NO_ENCONTRADO', 'Vehículo no encontrado.');
    if (cmd.activo === false && (await this.vehicles.hasActiveTurn(id))) {
      throw AppException.conflict(
        'VEHICULO_CON_TURNO_ACTIVO',
        'No se puede desactivar un vehículo con turno activo.',
      );
    }
    return this.vehicles.update(id, {
      tipoVehiculo: cmd.tipoVehiculo,
      marca: cmd.marca?.trim(),
      modelo: cmd.modelo?.trim(),
      color: cmd.color?.trim(),
      activo: cmd.activo,
      year: cmd.year,
      vehicleClass: cmd.vehicleClass === undefined ? undefined : cmd.vehicleClass?.trim() || null,
      country: cmd.country === undefined ? undefined : cmd.country?.trim() || null,
      serviceType: cmd.serviceType === undefined ? undefined : cmd.serviceType?.trim() || null,
    });
  }
}
