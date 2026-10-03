import { VehicleProviderError } from '../../domain/types/vehicle-lookup.types';
import { parseProviderBody } from './webservices-ec.mapper';

// Basado en el ejemplo aportado; chasis y motor son valores ficticios de prueba.
const FULL_BODY = {
  status: true,
  data: {
    Id: 2686887,
    Placa: 'PBH1234',
    Clase: 'CAMIONETA',
    Marca: 'CHEVROLET',
    Modelo: 'LUV D-MAX CS 4X2 TM',
    Anio: '2007',
    Pais: 'ECUADOR',
    Color: 'VINO',
    Servicio: 'PARTICULAR',
    FechaMatricula: '2023-09-08',
    FechaCaducidad: '2024-09-08T00:00:00',
    AnioAuto: 2023,
    Chasis: 'CHASIS-PRUEBA-0001',
    Motor: 'MOTOR-PRUEBA-0001',
  },
};

function expectProviderError(fn: () => unknown, kind: string): void {
  try {
    fn();
    throw new Error('se esperaba VehicleProviderError');
  } catch (error) {
    expect(error).toBeInstanceOf(VehicleProviderError);
    expect((error as VehicleProviderError).kind).toBe(kind);
  }
}

describe('parseProviderBody', () => {
  it('mapea los catorce campos con nombres estables', () => {
    expect(parseProviderBody(FULL_BODY, 'PBH1234')).toEqual({
      kind: 'FOUND',
      data: {
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
        chassis: 'CHASIS-PRUEBA-0001',
        engineNumber: 'MOTOR-PRUEBA-0001',
      },
    });
  });

  it('representa campos ausentes o vacíos como null sin inventar valores', () => {
    const result = parseProviderBody(
      { status: true, data: { Placa: 'PBH-1234', Marca: 'KIA', Color: '', Motor: null } },
      'PBH1234',
    );
    expect(result).toEqual({
      kind: 'FOUND',
      data: expect.objectContaining({
        licensePlate: 'PBH1234',
        brand: 'KIA',
        color: null,
        engineNumber: null,
        chassis: null,
        year: null,
        registrationDate: null,
      }),
    });
  });

  it('acepta la placa de dos letras con guion devuelta por el proveedor', () => {
    const result = parseProviderBody({ status: true, data: { Placa: 'IA-7000' } }, 'IA7000');
    expect(result.kind).toBe('FOUND');
  });

  it('interpreta status:false con mensaje explícito como no encontrado', () => {
    expect(
      parseProviderBody({ status: false, message: 'No se encontraron resultados' }, 'PBH1234'),
    ).toEqual({ kind: 'NOT_FOUND' });
  });

  it('status:false sin motivo determinable es error del proveedor', () => {
    expectProviderError(
      () => parseProviderBody({ status: false, message: 'Error interno' }, 'PBH1234'),
      'INVALID_RESPONSE',
    );
  });

  it('rechaza placa diferente a la solicitada', () => {
    expectProviderError(
      () =>
        parseProviderBody(
          { ...FULL_BODY, data: { ...FULL_BODY.data, Placa: 'PBH9999' } },
          'PBH1234',
        ),
      'INVALID_RESPONSE',
    );
  });

  it.each([
    ['cuerpo no objeto', 'hola'],
    ['sin status', { data: {} }],
    ['status true sin data', { status: true }],
    ['data array', { status: true, data: [] }],
    ['tipo inválido', { status: true, data: { ...FULL_BODY.data, Marca: { x: 1 } } }],
    ['año no numérico', { status: true, data: { ...FULL_BODY.data, Anio: 'dos mil' } }],
    ['fecha inválida', { status: true, data: { ...FULL_BODY.data, FechaMatricula: '2023-02-30' } }],
  ])('esquema inválido: %s', (_label, body) => {
    expectProviderError(() => parseProviderBody(body, 'PBH1234'), 'INVALID_RESPONSE');
  });
});
