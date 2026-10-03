import { ConfigService } from '@nestjs/config';
import { AppException } from '../../../../common/errors/app.exception';
import type { VehicleRepositoryPort } from '../../domain/interfaces/vehicle-repository.port';
import { VehicleLookupSnapshot } from '../../domain/types/vehicle-lookup.types';
import { PlateAlreadyRegisteredError, VehicleRecord } from '../../domain/types/vehicle.types';
import { RegisterVehicleCommand, RegisterVehicleUseCase } from './register-vehicle.use-case';

const CLIENTE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CLIENTE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const CMD: RegisterVehicleCommand = {
  clienteId: CLIENTE_A,
  placa: 'pbh-1234',
  tipoVehiculo: 'CAMIONETA',
  marca: ' Chevrolet ',
  modelo: 'D-Max',
  color: 'Vino',
};

const SNAPSHOT: VehicleLookupSnapshot = {
  licensePlate: 'PBH1234',
  providerVehicleId: 2686887,
  vehicleClass: 'CAMIONETA',
  brand: 'CHEVROLET',
  model: 'LUV D-MAX',
  year: 2007,
  country: 'ECUADOR',
  color: 'VINO',
  serviceType: 'PARTICULAR',
  registrationDate: '2023-09-08',
  registrationExpiryDate: '2024-09-08',
  providerAutoYear: 2023,
  chassis: 'CH-1',
  engineNumber: 'MO-1',
  queriedAt: new Date('2026-10-03T19:00:00Z'),
};

function vehicle(overrides: Partial<VehicleRecord> = {}): VehicleRecord {
  return {
    id: 'vvvvvvvv-vvvv-4vvv-8vvv-vvvvvvvvvvvv',
    clienteId: CLIENTE_A,
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
    ...overrides,
  };
}

function setup() {
  const repo = {
    findClienteActivo: jest.fn().mockResolvedValue({ activo: true }),
    findByPlaca: jest.fn().mockResolvedValue(null),
    findLookupSnapshot: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockImplementation((data) => Promise.resolve(vehicle({ ...data, activo: true }))),
    update: jest.fn().mockImplementation((_id, data) => Promise.resolve(vehicle(data))),
  } as unknown as jest.Mocked<VehicleRepositoryPort>;
  const config = { getOrThrow: () => 24 } as unknown as ConfigService;
  return { repo, useCase: new RegisterVehicleUseCase(repo, config) };
}

describe('RegisterVehicleUseCase', () => {
  it('registro manual sin consulta previa queda como MANUAL (no verificado)', async () => {
    const { repo, useCase } = setup();
    const result = await useCase.execute(CMD);
    expect(result.created).toBe(true);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        placa: 'PBH1234',
        marca: 'Chevrolet',
        dataSource: 'MANUAL',
        providerQueriedAt: null,
        chassis: null,
      }),
    );
  });

  it('con consulta reciente al proveedor guarda procedencia y datos del snapshot del backend', async () => {
    const { repo, useCase } = setup();
    repo.findLookupSnapshot.mockResolvedValue(SNAPSHOT);
    await useCase.execute({ ...CMD, year: 2008 });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSource: 'WEBSERVICES_EC',
        providerQueriedAt: SNAPSHOT.queriedAt,
        providerVehicleId: 2686887,
        registrationExpiryDate: '2024-09-08',
        chassis: 'CH-1',
        year: 2008, // valor confirmado/corregido por el usuario
      }),
    );
  });

  it('placa de otro cliente → 409 sin reasignar propiedad', async () => {
    const { repo, useCase } = setup();
    repo.findByPlaca.mockResolvedValue(vehicle({ clienteId: CLIENTE_B }));
    await expect(useCase.execute(CMD)).rejects.toMatchObject({
      code: 'PLACA_REGISTRADA_OTRO_CLIENTE',
    });
    expect(repo.update).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('placa del mismo cliente se actualiza y reactiva (created=false)', async () => {
    const { repo, useCase } = setup();
    repo.findByPlaca.mockResolvedValue(vehicle({ activo: false }));
    const result = await useCase.execute(CMD);
    expect(result.created).toBe(false);
    expect(repo.update).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ activo: true }),
    );
  });

  it('carrera: otra petición registró la placa para otro cliente → 409', async () => {
    const { repo, useCase } = setup();
    repo.findByPlaca
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(vehicle({ clienteId: CLIENTE_B }));
    repo.create.mockRejectedValue(new PlateAlreadyRegisteredError());
    await expect(useCase.execute(CMD)).rejects.toMatchObject({
      code: 'PLACA_REGISTRADA_OTRO_CLIENTE',
    });
  });

  it('carrera: la misma placa del mismo cliente se resuelve sin error', async () => {
    const { repo, useCase } = setup();
    repo.findByPlaca.mockResolvedValueOnce(null).mockResolvedValueOnce(vehicle());
    repo.create.mockRejectedValue(new PlateAlreadyRegisteredError());
    await expect(useCase.execute(CMD)).resolves.toMatchObject({ created: false });
  });

  it('cliente inexistente o inactivo', async () => {
    const { repo, useCase } = setup();
    repo.findClienteActivo.mockResolvedValueOnce(null);
    await expect(useCase.execute(CMD)).rejects.toMatchObject({ code: 'CLIENTE_NO_ENCONTRADO' });
    repo.findClienteActivo.mockResolvedValueOnce({ activo: false });
    await expect(useCase.execute(CMD)).rejects.toMatchObject({ code: 'CLIENTE_INACTIVO' });
  });

  it('placa inválida → 400', async () => {
    const { useCase } = setup();
    await expect(useCase.execute({ ...CMD, placa: 'XX' })).rejects.toBeInstanceOf(AppException);
  });
});
