import { ValidationError } from 'class-validator';
import { AppException, ErrorDetail } from '../errors/app.exception';

function flatten(errors: ValidationError[], parent = ''): ErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

/** exceptionFactory del ValidationPipe global con el formato de error estable. */
export function validationExceptionFactory(errors: ValidationError[]): AppException {
  return AppException.badRequest('INVALID_INPUT', 'Datos de entrada inválidos.', flatten(errors));
}
