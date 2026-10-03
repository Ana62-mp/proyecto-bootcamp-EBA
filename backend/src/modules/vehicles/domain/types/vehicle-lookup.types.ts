/** Datos vehiculares con nombres estables para el frontend (§13.5). */
export interface VehicleData {
  providerVehicleId: number | null;
  licensePlate: string;
  vehicleClass: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  country: string | null;
  color: string | null;
  serviceType: string | null;
  /** YYYY-MM-DD sin zona horaria. */
  registrationDate: string | null;
  registrationExpiryDate: string | null;
  providerAutoYear: number | null;
  chassis: string | null;
  engineNumber: string | null;
}

/** Campos vehiculares que pueden faltar (la placa siempre está presente). */
export const VEHICLE_DATA_FIELDS = [
  'providerVehicleId',
  'vehicleClass',
  'brand',
  'model',
  'year',
  'country',
  'color',
  'serviceType',
  'registrationDate',
  'registrationExpiryDate',
  'providerAutoYear',
  'chassis',
  'engineNumber',
] as const satisfies ReadonlyArray<keyof VehicleData>;

export function missingFieldsOf(data: VehicleData): string[] {
  return VEHICLE_DATA_FIELDS.filter((field) => data[field] === null);
}

export type LookupSource = 'LOCAL' | 'WEBSERVICES_EC';

export interface VehicleLookupResult {
  vehicleId: string | null;
  data: VehicleData;
  source: LookupSource;
  queriedAt: Date;
  providerQueriedAt: Date | null;
  missingFields: string[];
}

export type ProviderLookupOutcome = { found: true; data: VehicleData } | { found: false };

export type VehicleProviderErrorKind = 'UNAVAILABLE' | 'TIMEOUT' | 'INVALID_RESPONSE';

/** Fallo del proveedor externo; el caso de uso lo traduce a 502/503/504. */
export class VehicleProviderError extends Error {
  constructor(
    readonly kind: VehicleProviderErrorKind,
    readonly providerStatus?: number,
  ) {
    super(`Proveedor vehicular: ${kind}`);
    this.name = 'VehicleProviderError';
  }
}

/** Último resultado del proveedor para una placa, usado para registrar su procedencia. */
export interface VehicleLookupSnapshot extends VehicleData {
  queriedAt: Date;
}
