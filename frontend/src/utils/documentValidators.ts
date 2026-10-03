/**
 * Document, Email, Phone and Plate validation utilities for Ecuador
 */
import { TipoDocumento } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  cleanedValue: string;
}

/**
 * Validates Ecuadorian Cédula using the standard Modulo 10 algorithm
 */
export function validarCedula(cedulaInput: string): ValidationResult {
  const cleaned = (cedulaInput || '').replace(/[\s-]/g, '');

  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'Ingresa una cédula ecuatoriana válida de 10 dígitos (solo números).'
    };
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'Ingresa una cédula ecuatoriana válida de 10 dígitos.'
    };
  }

  // Reject repeated patterns like 0000000000, 1111111111, etc.
  if (/^(\d)\1{9}$/.test(cleaned)) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'La cédula no puede contener dígitos repetidos idénticos.'
    };
  }

  const provincia = parseInt(cleaned.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'El código provincial de la cédula no es válido (01 a 24).'
    };
  }

  const tercerDigito = parseInt(cleaned.charAt(2), 10);
  if (tercerDigito >= 6) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'El tercer dígito de la cédula de persona natural debe ser menor a 6.'
    };
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cleaned.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const digitoVerificadorCalculado = (10 - (suma % 10)) % 10;
  const digitoVerificadorReal = parseInt(cleaned.charAt(9), 10);

  if (digitoVerificadorCalculado !== digitoVerificadorReal) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'El dígito verificador de la cédula no coincide. Verifica los números.'
    };
  }

  return {
    isValid: true,
    cleanedValue: cleaned
  };
}

/**
 * Validates international passport (6 to 20 alphanumeric characters)
 */
export function validarPasaporte(pasaporteInput: string): ValidationResult {
  const cleaned = (pasaporteInput || '').trim().toUpperCase();

  if (!cleaned) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'Ingresa un número de pasaporte válido, de 6 a 20 caracteres.'
    };
  }

  if (cleaned.length < 6 || cleaned.length > 20) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'Ingresa un número de pasaporte válido, de 6 a 20 caracteres.'
    };
  }

  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'El pasaporte solo puede contener letras y números sin caracteres especiales.'
    };
  }

  return {
    isValid: true,
    cleanedValue: cleaned
  };
}

/**
 * Validates Ecuadorian RUC (13 digits, ending in 001)
 */
export function validarRUC(rucInput: string): ValidationResult {
  const cleaned = (rucInput || '').replace(/[\s-]/g, '');

  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'Ingresa un RUC válido de 13 dígitos terminado en 001.'
    };
  }

  if (cleaned.length !== 13) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'Ingresa un RUC válido de 13 dígitos terminado en 001.'
    };
  }

  if (!cleaned.endsWith('001')) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'Ingresa un RUC válido de 13 dígitos terminado en 001.'
    };
  }

  // Reject sequence of identical numbers
  if (/^(\d)\1{12}$/.test(cleaned)) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'El RUC no puede ser una secuencia de números repetidos.'
    };
  }

  const provincia = parseInt(cleaned.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'El código provincial del RUC no es válido (01 a 24).'
    };
  }

  // Persona natural RUC check (first 10 digits as cedula)
  const tercerDigito = parseInt(cleaned.charAt(2), 10);
  if (tercerDigito < 6) {
    const cedulaPartValidation = validarCedula(cleaned.substring(0, 10));
    if (!cedulaPartValidation.isValid) {
      return {
        isValid: false,
        cleanedValue: cleaned,
        errorMessage: 'Los primeros 10 dígitos del RUC corresponden a una cédula inválida.'
      };
    }
  }

  return {
    isValid: true,
    cleanedValue: cleaned
  };
}

/**
 * Unified document validator according to TipoDocumento
 */
export function validarDocumento(tipo: TipoDocumento, valor: string): ValidationResult {
  switch (tipo) {
    case 'CEDULA':
      return validarCedula(valor);
    case 'PASAPORTE':
      return validarPasaporte(valor);
    case 'RUC':
      return validarRUC(valor);
    default:
      return {
        isValid: false,
        cleanedValue: valor,
        errorMessage: 'Tipo de documento no reconocido.'
      };
  }
}

/**
 * Validates Email: strictly requires '@' and a domain dot '.'
 */
export function validarCorreo(correoInput: string): ValidationResult {
  const cleaned = (correoInput || '').trim();

  if (!cleaned) {
    return { isValid: true, cleanedValue: '' }; // Optional email
  }

  // Must contain '@' and '.'
  if (!cleaned.includes('@') || !cleaned.includes('.')) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'El correo electrónico debe contener un "@" y un dominio con punto (ejemplo: usuario@correo.com).'
    };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleaned)) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'Formato de correo inválido. Ejemplo: usuario@dominio.com'
    };
  }

  return {
    isValid: true,
    cleanedValue: cleaned
  };
}

/**
 * Validates phone / cellphone: must contain ONLY digits, 9 or 10 digits
 */
export function validarCelular(celularInput: string): ValidationResult {
  const cleaned = (celularInput || '').trim();

  if (!cleaned) {
    return {
      isValid: false,
      cleanedValue: '',
      errorMessage: 'El número de teléfono o celular es obligatorio.'
    };
  }

  // Only digits allowed
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      cleanedValue: cleaned.replace(/\D/g, ''),
      errorMessage: 'El número de celular solo debe contener dígitos numéricos (sin letras ni caracteres especiales).'
    };
  }

  if (cleaned.length < 9 || cleaned.length > 10) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'El número debe tener entre 9 y 10 dígitos numéricos (ejemplo celular: 0991234567).'
    };
  }

  return {
    isValid: true,
    cleanedValue: cleaned
  };
}

/**
 * Real-time plate formatter that automatically adds '-' after 3 letters
 * and restricts input strictly to 3 letters + hyphen + 3 or 4 digits.
 */
export function formatearPlacaEnTiempoReal(input: string): string {
  if (!input) return '';

  // Uppercase and clean all non-alphanumeric
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Extract up to 3 leading letters
  let letters = '';
  let rest = '';

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (letters.length < 3 && /[A-Z]/.test(char)) {
      letters += char;
    } else if (letters.length === 3 && /[0-9]/.test(char) && rest.length < 4) {
      rest += char;
    }
  }

  if (letters.length === 3) {
    return rest ? `${letters}-${rest}` : `${letters}-`;
  }

  return letters;
}

/**
 * Normalizes and validates Ecuadorian vehicle license plate
 * Strictly requires 3 uppercase letters, a hyphen, and 3 or 4 digits: ABC-123 or ABC-1234
 */
export function normalizarYValidarPlaca(placaInput: string): ValidationResult {
  let cleaned = (placaInput || '').trim().toUpperCase();

  // If user pasted without hyphen e.g. "ABC1234", auto-add hyphen
  if (/^[A-Z]{3}\d{3,4}$/.test(cleaned.replace(/-/g, ''))) {
    const noHyphen = cleaned.replace(/-/g, '');
    cleaned = `${noHyphen.substring(0, 3)}-${noHyphen.substring(3)}`;
  }

  if (!cleaned) {
    return {
      isValid: false,
      cleanedValue: '',
      errorMessage: 'La placa es obligatoria.'
    };
  }

  // Strict regex: exactly 3 letters, a hyphen, and 3 or 4 digits
  const regexAuto = /^[A-Z]{3}-\d{3,4}$/;

  if (!regexAuto.test(cleaned)) {
    return {
      isValid: false,
      cleanedValue: cleaned,
      errorMessage: 'Formato de placa inválido. Debe contener exactamente 3 letras, guión y 3 o 4 dígitos (ejemplo: ABC-1234 o ABC-123).'
    };
  }

  return {
    isValid: true,
    cleanedValue: cleaned
  };
}
