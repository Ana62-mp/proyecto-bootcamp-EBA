import { AppException, ErrorDetail } from '../../../../common/errors/app.exception';
import { ClienteData, TipoDocumento } from '../../domain/types/cliente.types';
import {
  validarCelular,
  validarCorreo,
  validarDocumento,
} from '../../domain/validators/documento.validator';

export interface ClienteInput {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres?: string | null;
  apellidos?: string | null;
  razonSocial?: string | null;
  nombreContacto?: string | null;
  telefono: string;
  correo?: string | null;
}

const clean = (value: string | null | undefined): string | null => value?.trim() || null;

/**
 * Valida y normaliza los datos de un cliente.
 * RUC exige razón social; cédula y pasaporte exigen nombres y apellidos.
 * Con `validarDoc = false` (edición sin cambio de documento) el documento se conserva tal cual.
 */
export function normalizarCliente(input: ClienteInput, validarDoc = true): ClienteData {
  const details: ErrorDetail[] = [];

  const documento = validarDoc
    ? validarDocumento(input.tipoDocumento, input.numeroDocumento)
    : { isValid: true, cleanedValue: input.numeroDocumento };
  if (!documento.isValid)
    details.push({ field: 'numeroDocumento', message: documento.errorMessage! });

  const esRuc = input.tipoDocumento === 'RUC';
  const nombres = esRuc ? null : clean(input.nombres);
  const apellidos = esRuc ? null : clean(input.apellidos);
  const razonSocial = esRuc ? clean(input.razonSocial) : null;
  const nombreContacto = esRuc ? clean(input.nombreContacto) : null;

  if (esRuc && !razonSocial)
    details.push({ field: 'razonSocial', message: 'La razón social es obligatoria.' });
  if (!esRuc && !nombres)
    details.push({ field: 'nombres', message: 'Los nombres son obligatorios.' });
  if (!esRuc && !apellidos)
    details.push({ field: 'apellidos', message: 'Los apellidos son obligatorios.' });

  const telefono = validarCelular(input.telefono);
  if (!telefono.isValid) details.push({ field: 'telefono', message: telefono.errorMessage! });

  const correo = validarCorreo(input.correo);
  if (!correo.isValid) details.push({ field: 'correo', message: correo.errorMessage! });

  if (details.length > 0) {
    throw AppException.badRequest(
      'INVALID_CLIENTE',
      'Los datos del cliente no son válidos.',
      details,
    );
  }

  return {
    tipoDocumento: input.tipoDocumento,
    numeroDocumento: documento.cleanedValue,
    nombres,
    apellidos,
    razonSocial,
    nombreContacto,
    telefono: telefono.cleanedValue,
    correo: correo.cleanedValue || null,
  };
}
