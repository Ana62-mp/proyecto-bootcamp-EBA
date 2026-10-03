import { ConfigService } from '@nestjs/config';
import { AppException } from '../../../../common/errors/app.exception';
import type { VehicleLookupPort } from '../../domain/interfaces/vehicle-lookup.port';
import type { VehicleRepositoryPort } from '../../domain/interfaces/vehicle-repository.port';
import { VehicleData, VehicleProviderError } from '../../domain/types/vehicle-lookup.types';
import { VehicleRecord } from '../../domain/types/vehicle.types';
import { LookupRateLimiterService } from '../services/lookup-rate-limiter.service';
import { LookupVehicleUseCase } from './lookup-vehicle.use-case';

const PROVIDER_DATA: VehicleData = {
  providerVehicleId: 2686887,
  licensePlate: 'PBH1234',
  vehicleClass: 'CAMIONETA',
  brand: 'CHEVROLET',
  model: 'LUV D-MAX CS 4X2 TM',
  year: 2007,
  country: 'ECUADOR',
  color: 'VINO',
  serviceType: 'PARTICULAR',
  registrationDate: '2023-09-08',
  registrationExpiryDate: '2024-09-08',
  providerAutoYear: 2023,
  chassis: null,
  engineNumber: null,
};

const LOCAL_VEHICLE: VehicleRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  clienteId: '22222222-2222-4222-8222-222222222222',
  placa: 'PBH1234',
  tipoVehiculo: 'CAMIONETA',
  marca: 'Chevrolet',
  modelo: 'D-Max',
  color: 'Vino',
  activo: true,
  providerVehicleId: null,
  vehicleClass: null,
  year: null,
  country: null,
  serviceType: null,
  registrationDate: null,
  registrationExpiryDate: null,
  providerAutoYear: null,
  chassis: null,
  engineNumber: null,
  dataSource: 'MANUAL',
  providerQueriedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setup(limit = 30) {
  const vehicles = {
    findByPlaca: jest.fn().mockResolvedValue(null),
    saveLookupSnapshot: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<VehicleRepositoryPort>;
  const provider = {
    isEnabled: jest.fn().mockReturnValue(true),
    lookup: jest.fn().mockResolvedValue({ found: true, data: PROVIDER_DATA }),
  } as jest.Mocked<VehicleLookupPort>;
  const limiter = new LookupRateLimiterService({
    getOrThrow: () => limit,
  } as unknown as ConfigService);
  return { vehicles, provider, useCase: new LookupVehicleUseCase(vehicles, provider, limiter) };
}

async function expectAppError(
  promise: Promise<unknown>,
  status: number,
  code: string,
): Promise<void> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppException);
  expect((error as AppException).getStatus()).toBe(status);
  expect((error as AppException).code).toBe(code);
}

describe('LookupVehicleUseCase', () => {
  it('placa inválida → 400 sin llamar al proveedor ni a la base', async () => {
    const { useCase, provider, vehicles } = setup();
    await expectAppError(useCase.execute('actor', 'PB<script>'), 400, 'INVALID_LICENSE_PLATE');
    expect(provider.lookup).not.toHaveBeenCalled();
    expect(vehicles.findByPlaca).not.toHaveBeenCalled();
  });

  it('hallazgo local devuelve el contrato completo sin invocar al proveedor', async () => {
    const { useCase, provider, vehicles } = setup();
    vehicles.findByPlaca.mockResolvedValue(LOCAL_VEHICLE);

    const result = await useCase.execute('actor', 'pbh-1234');

    expect(vehicles.findByPlaca).toHaveBeenCalledWith('PBH1234');
    expect(provider.lookup).not.toHaveBeenCalled();
    expect(result.source).toBe('LOCAL');
    expect(result.vehicleId).toBe(LOCAL_VEHICLE.id);
    expect(result.providerQueriedAt).toBeNull();
    expect(result.data).toMatchObject({
      licensePlate: 'PBH1234',
      brand: 'Chevrolet',
      model: 'D-Max',
    });
    expect(result.missingFields).toContain('chassis');
    expect(result.missingFields).not.toContain('brand');
  });

  it('fallback externo: usa providerQuery, devuelve vehicleId null y no registra vehículos', async () => {
    const { useCase, provider, vehicles } = setup();
    const result = await useCase.execute('actor', 'PBH1234');

    expect(provider.lookup).toHaveBeenCalledWith('PBH1234', 'PBH1234');
    expect(result).toMatchObject({
      vehicleId: null,
      source: 'WEBSERVICES_EC',
      data: PROVIDER_DATA,
    });
    expect(result.missingFields).toEqual(['chassis', 'engineNumber']);
    expect(vehicles.create).not.toHaveBeenCalled();
    expect(vehicles.update).not.toHaveBeenCalled();
    expect(vehicles.saveLookupSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ licensePlate: 'PBH1234', queriedAt: expect.any(Date) }),
    );
  });

  it('placa de dos letras se consulta con guion', async () => {
    const { useCase, provider } = setup();
    provider.lookup.mockResolvedValue({
      found: true,
      data: { ...PROVIDER_DATA, licensePlate: 'IA7000' },
    });
    await useCase.execute('actor', 'ia7000');
    expect(provider.lookup).toHaveBeenCalledWith('IA-7000', 'IA7000');
  });

  it('ausencia confirmada local y externamente → 404 VEHICLE_NOT_FOUND', async () => {
    const { useCase, provider } = setup();
    provider.lookup.mockResolvedValue({ found: false });
    await expectAppError(useCase.execute('actor', 'PBH1234'), 404, 'VEHICLE_NOT_FOUND');
  });

  it.each([
    ['UNAVAILABLE', 503, 'VEHICLE_PROVIDER_UNAVAILABLE'],
    ['TIMEOUT', 504, 'VEHICLE_PROVIDER_TIMEOUT'],
    ['INVALID_RESPONSE', 502, 'VEHICLE_PROVIDER_INVALID_RESPONSE'],
  ] as const)('error del proveedor %s → %i', async (kind, status, code) => {
    const { useCase, provider, vehicles } = setup();
    provider.lookup.mockRejectedValue(new VehicleProviderError(kind));
    await expectAppError(useCase.execute('actor', 'PBH1234'), status, code);
    expect(vehicles.saveLookupSnapshot).not.toHaveBeenCalled();
  });

  it('límite propio por actor → 429 LOOKUP_RATE_LIMITED', async () => {
    const { useCase } = setup(2);
    await useCase.execute('maquina-1', 'PBH1234');
    await useCase.execute('maquina-1', 'PBH1234');
    await expectAppError(useCase.execute('maquina-1', 'PBH1234'), 429, 'LOOKUP_RATE_LIMITED');
    // Otro actor no se ve afectado.
    await expect(useCase.execute('maquina-2', 'PBH1234')).resolves.toBeDefined();
  });
});
