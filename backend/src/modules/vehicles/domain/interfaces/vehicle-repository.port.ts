import { VehicleLookupSnapshot } from '../types/vehicle-lookup.types';
import { CreateVehicleData, UpdateVehicleData, VehicleRecord } from '../types/vehicle.types';

export const VEHICLE_REPOSITORY = Symbol('VEHICLE_REPOSITORY');

export interface VehicleRepositoryPort {
  findById(id: string): Promise<VehicleRecord | null>;
  findByPlaca(placa: string): Promise<VehicleRecord | null>;
  /** Lanza PlateAlreadyRegisteredError si la placa ya existe. */
  create(data: CreateVehicleData): Promise<VehicleRecord>;
  update(id: string, data: UpdateVehicleData): Promise<VehicleRecord>;
  findClienteActivo(clienteId: string): Promise<{ activo: boolean } | null>;
  hasActiveTurn(vehiculoId: string): Promise<boolean>;
  saveLookupSnapshot(snapshot: VehicleLookupSnapshot): Promise<void>;
  findLookupSnapshot(placa: string, notBefore: Date): Promise<VehicleLookupSnapshot | null>;
}
