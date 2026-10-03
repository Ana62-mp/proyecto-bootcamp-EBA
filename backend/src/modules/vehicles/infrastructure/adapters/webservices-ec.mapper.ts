/**
 * Validación en tiempo de ejecución y mapeo de la respuesta de webservices.ec (§13.5).
 * Un cast de TypeScript no valida JSON externo: cada campo se comprueba aquí.
 */
import { normalizeLookupPlate } from '../../domain/plate';
import { VehicleData, VehicleProviderError } from '../../domain/types/vehicle-lookup.types';

const NOT_FOUND_MESSAGE =
  /no\s+(se\s+)?(ha\s+)?(encontr|exist|registr)|not\s*found|sin\s+resultados|no\s+hay\s+(datos|resultados|informaci)/i;

function invalid(): never {
  throw new VehicleProviderError('INVALID_RESPONSE');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return invalid();
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function int(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isInteger(value) ? value : invalid();
  if (typeof value !== 'string') return invalid();
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : invalid();
}

function isRealDate(y: number, m: number, d: number): boolean {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Acepta YYYY-MM-DD (con hora opcional) o DD/MM/YYYY; devuelve YYYY-MM-DD sin desplazar zona. */
function dateOnly(value: unknown): string | null {
  const raw = str(value);
  if (raw === null || /^0{4}-0{2}-0{2}/.test(raw)) return null;
  let y: number, m: number, d: number;
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/.exec(raw);
  const latam = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (latam) [y, m, d] = [Number(latam[3]), Number(latam[2]), Number(latam[1])];
  else return invalid();
  if (!isRealDate(y, m, d)) return invalid();
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export type ParsedProviderBody = { kind: 'FOUND'; data: VehicleData } | { kind: 'NOT_FOUND' };

/**
 * Exige status === true, data válido y placa coincidente con la solicitada.
 * status:false solo se interpreta como "no encontrado" si el mensaje lo indica explícitamente.
 */
export function parseProviderBody(body: unknown, expectedLicensePlate: string): ParsedProviderBody {
  if (!isRecord(body) || typeof body.status !== 'boolean') return invalid();

  if (body.status === false) {
    const message = [body.message, body.mensaje, body.error]
      .filter((v): v is string => typeof v === 'string')
      .join(' ');
    if (NOT_FOUND_MESSAGE.test(message)) return { kind: 'NOT_FOUND' };
    return invalid();
  }

  const data = body.data;
  if (!isRecord(data)) return invalid();

  const placa = normalizeLookupPlate(str(data.Placa));
  if (!placa || placa.licensePlate !== expectedLicensePlate) return invalid();

  return {
    kind: 'FOUND',
    data: {
      providerVehicleId: int(data.Id),
      licensePlate: placa.licensePlate,
      vehicleClass: str(data.Clase),
      brand: str(data.Marca),
      model: str(data.Modelo),
      year: int(data.Anio),
      country: str(data.Pais),
      color: str(data.Color),
      serviceType: str(data.Servicio),
      registrationDate: dateOnly(data.FechaMatricula),
      registrationExpiryDate: dateOnly(data.FechaCaducidad),
      providerAutoYear: int(data.AnioAuto),
      chassis: str(data.Chasis),
      engineNumber: str(data.Motor),
    },
  };
}
