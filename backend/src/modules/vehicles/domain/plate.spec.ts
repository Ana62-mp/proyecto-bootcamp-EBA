import { normalizeLookupPlate, normalizeRegistrationPlate } from './plate';

describe('normalizeLookupPlate (§13.4)', () => {
  it.each([
    ['pbh-1234', 'PBH1234', 'PBH1234'],
    [' PBH1234 ', 'PBH1234', 'PBH1234'],
    ['IA-7000', 'IA7000', 'IA-7000'],
    ['ia7000', 'IA7000', 'IA-7000'],
  ])('%p → canónica %p, proveedor %p', (input, licensePlate, providerQuery) => {
    expect(normalizeLookupPlate(input)).toEqual({ licensePlate, providerQuery });
  });

  it.each([
    '',
    '   ',
    'PBH123', // 3 dígitos: no aceptado para el proveedor
    'PBH12345',
    'P1234',
    'PBHX1234',
    'PB-H1234',
    'PBH--1234',
    'PBH 1234', // espacio interno
    'PBH_1234',
    'PBH1234;DROP',
    'ÑBH1234',
    '1234PBH',
    '3G1JC5248YS100001', // VIN no se acepta como placa
  ])('rechaza %p', (input) => {
    expect(normalizeLookupPlate(input)).toBeNull();
  });

  it('rechaza null y undefined', () => {
    expect(normalizeLookupPlate(null)).toBeNull();
    expect(normalizeLookupPlate(undefined)).toBeNull();
  });
});

describe('normalizeRegistrationPlate', () => {
  it('acepta los formatos de consulta y el formato de 3 dígitos del kiosko', () => {
    expect(normalizeRegistrationPlate('PBH-4321')).toBe('PBH4321');
    expect(normalizeRegistrationPlate('ia-7000')).toBe('IA7000');
    expect(normalizeRegistrationPlate('abc-123')).toBe('ABC123');
  });

  it('no trunca ni rellena placas inválidas', () => {
    expect(normalizeRegistrationPlate('AB-123')).toBeNull();
    expect(normalizeRegistrationPlate('ABC-12')).toBeNull();
  });
});
