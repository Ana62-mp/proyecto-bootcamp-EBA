/**
 * Normalización de placas (§13.4).
 * - licensePlate: canónica para búsqueda y almacenamiento (mayúsculas, sin guion).
 * - providerQuery: formato que espera webservices.ec.
 */
export interface NormalizedPlate {
  licensePlate: string;
  providerQuery: string;
}

const ALLOWED_CHARS = /^[A-Z0-9-]+$/;
const THREE_LETTERS_FOUR_DIGITS = /^([A-Z]{3})-?([0-9]{4})$/;
const TWO_LETTERS_FOUR_DIGITS = /^([A-Z]{2})-?([0-9]{4})$/;
// Formato heredado del frontend (ABC-123); se acepta al registrar, no en la consulta externa.
const THREE_LETTERS_THREE_DIGITS = /^([A-Z]{3})-?([0-9]{3})$/;

function prepare(input: string | null | undefined): string | null {
  const value = (input ?? '').trim().toUpperCase();
  return value && ALLOWED_CHARS.test(value) ? value : null;
}

/** Placas aceptadas para la consulta al proveedor: ABC1234 / ABC-1234 / IA7000 / IA-7000. */
export function normalizeLookupPlate(input: string | null | undefined): NormalizedPlate | null {
  const value = prepare(input);
  if (!value) return null;

  const three = THREE_LETTERS_FOUR_DIGITS.exec(value);
  if (three) {
    const canonical = `${three[1]}${three[2]}`;
    return { licensePlate: canonical, providerQuery: canonical };
  }
  const two = TWO_LETTERS_FOUR_DIGITS.exec(value);
  if (two) {
    return { licensePlate: `${two[1]}${two[2]}`, providerQuery: `${two[1]}-${two[2]}` };
  }
  return null;
}

/** Placa canónica para registrar un vehículo; incluye el formato de 3 dígitos del kiosko. */
export function normalizeRegistrationPlate(input: string | null | undefined): string | null {
  const lookup = normalizeLookupPlate(input);
  if (lookup) return lookup.licensePlate;
  const value = prepare(input);
  const short = value ? THREE_LETTERS_THREE_DIGITS.exec(value) : null;
  return short ? `${short[1]}${short[2]}` : null;
}
