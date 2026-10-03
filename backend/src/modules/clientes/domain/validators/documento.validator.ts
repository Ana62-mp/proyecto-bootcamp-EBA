/**
 * Validaciones de documentos y contacto para Ecuador.
 * Replican las reglas de frontend/src/utils/documentValidators.ts.
 */
import { TipoDocumento } from '../types/cliente.types';

export interface ValidationResult {
  isValid: boolean;
  cleanedValue: string;
  errorMessage?: string;
}

const ok = (cleanedValue: string): ValidationResult => ({ isValid: true, cleanedValue });
const fail = (cleanedValue: string, errorMessage: string): ValidationResult => ({
  isValid: false,
  cleanedValue,
  errorMessage,
});

function provinciaValida(digits: string): boolean {
  const provincia = parseInt(digits.substring(0, 2), 10);
  return (provincia >= 1 && provincia <= 24) || provincia === 30;
}

/** Cédula ecuatoriana con algoritmo módulo 10. */
export function validarCedula(input: string): ValidationResult {
  const cleaned = (input || '').replace(/[\s-]/g, '');
  if (!/^\d{10}$/.test(cleaned)) {
    return fail(cleaned, 'Ingresa una cédula ecuatoriana válida de 10 dígitos.');
  }
  if (/^(\d)\1{9}$/.test(cleaned)) {
    return fail(cleaned, 'La cédula no puede contener dígitos repetidos idénticos.');
  }
  if (!provinciaValida(cleaned)) {
    return fail(cleaned, 'El código provincial de la cédula no es válido (01 a 24).');
  }
  if (parseInt(cleaned.charAt(2), 10) >= 6) {
    return fail(cleaned, 'El tercer dígito de la cédula de persona natural debe ser menor a 6.');
  }
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cleaned.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }
  const verificador = (10 - (suma % 10)) % 10;
  if (verificador !== parseInt(cleaned.charAt(9), 10)) {
    return fail(cleaned, 'El dígito verificador de la cédula no coincide. Verifica los números.');
  }
  return ok(cleaned);
}

/** Pasaporte: 6 a 20 caracteres alfanuméricos. */
export function validarPasaporte(input: string): ValidationResult {
  const cleaned = (input || '').trim().toUpperCase();
  if (cleaned.length < 6 || cleaned.length > 20) {
    return fail(cleaned, 'Ingresa un número de pasaporte válido, de 6 a 20 caracteres.');
  }
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return fail(
      cleaned,
      'El pasaporte solo puede contener letras y números sin caracteres especiales.',
    );
  }
  return ok(cleaned);
}

/** RUC: 13 dígitos terminado en 001; persona natural valida la cédula base. */
export function validarRUC(input: string): ValidationResult {
  const cleaned = (input || '').replace(/[\s-]/g, '');
  if (!/^\d{13}$/.test(cleaned) || !cleaned.endsWith('001')) {
    return fail(cleaned, 'Ingresa un RUC válido de 13 dígitos terminado en 001.');
  }
  if (/^(\d)\1{12}$/.test(cleaned)) {
    return fail(cleaned, 'El RUC no puede ser una secuencia de números repetidos.');
  }
  if (!provinciaValida(cleaned)) {
    return fail(cleaned, 'El código provincial del RUC no es válido (01 a 24).');
  }
  if (parseInt(cleaned.charAt(2), 10) < 6 && !validarCedula(cleaned.substring(0, 10)).isValid) {
    return fail(cleaned, 'Los primeros 10 dígitos del RUC corresponden a una cédula inválida.');
  }
  return ok(cleaned);
}

export function validarDocumento(tipo: TipoDocumento, valor: string): ValidationResult {
  switch (tipo) {
    case 'CEDULA':
      return validarCedula(valor);
    case 'PASAPORTE':
      return validarPasaporte(valor);
    case 'RUC':
      return validarRUC(valor);
  }
}

/** Teléfono o celular: solo dígitos, 9 o 10. */
export function validarCelular(input: string): ValidationResult {
  const cleaned = (input || '').trim();
  if (!/^\d{9,10}$/.test(cleaned)) {
    return fail(
      cleaned,
      'El número debe tener entre 9 y 10 dígitos numéricos (ejemplo celular: 0991234567).',
    );
  }
  return ok(cleaned);
}

/** Correo opcional; si se envía debe tener formato usuario@dominio.tld. */
export function validarCorreo(input: string | null | undefined): ValidationResult {
  const cleaned = (input || '').trim();
  if (!cleaned) return ok('');
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleaned)) {
    return fail(cleaned, 'Formato de correo inválido. Ejemplo: usuario@dominio.com');
  }
  return ok(cleaned.toLowerCase());
}
