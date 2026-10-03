import { ProviderLookupOutcome } from '../types/vehicle-lookup.types';

export const VEHICLE_LOOKUP_PORT = Symbol('VEHICLE_LOOKUP_PORT');

export interface VehicleLookupPort {
  /** Indica si la integración externa está habilitada por configuración. */
  isEnabled(): boolean;
  /**
   * Consulta el proveedor externo. Lanza VehicleProviderError ante fallos;
   * devuelve { found: false } solo si el proveedor confirma la ausencia.
   */
  lookup(providerQuery: string, expectedLicensePlate: string): Promise<ProviderLookupOutcome>;
}
