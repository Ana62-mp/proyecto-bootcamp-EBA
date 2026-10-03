export type TipoVehiculo = 'AUTOMOVIL' | 'SUV' | 'CAMIONETA' | 'OTRO';
export type VehicleDataSource = 'MANUAL' | 'WEBSERVICES_EC';

export interface ProviderFields {
  providerVehicleId: number | null;
  vehicleClass: string | null;
  year: number | null;
  country: string | null;
  serviceType: string | null;
  registrationDate: string | null;
  registrationExpiryDate: string | null;
  providerAutoYear: number | null;
  chassis: string | null;
  engineNumber: string | null;
}

export interface VehicleRecord extends ProviderFields {
  id: string;
  clienteId: string;
  placa: string;
  tipoVehiculo: TipoVehiculo;
  marca: string;
  modelo: string;
  color: string;
  activo: boolean;
  dataSource: VehicleDataSource;
  providerQueriedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleData extends ProviderFields {
  clienteId: string;
  placa: string;
  tipoVehiculo: TipoVehiculo;
  marca: string;
  modelo: string;
  color: string;
  dataSource: VehicleDataSource;
  providerQueriedAt: Date | null;
}

export type UpdateVehicleData = Partial<
  Omit<CreateVehicleData, 'clienteId' | 'placa'> & { activo: boolean }
>;

/** La placa ya existe (posible carrera con otra petición). */
export class PlateAlreadyRegisteredError extends Error {
  constructor() {
    super('Placa ya registrada');
    this.name = 'PlateAlreadyRegisteredError';
  }
}
