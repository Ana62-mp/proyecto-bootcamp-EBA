import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorBody {
  error: { code: string; message: string; details: ErrorDetail[] };
}

/** Error de aplicación con código estable para el frontend (§11.2). */
export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
    readonly details: ErrorDetail[] = [],
  ) {
    super({ error: { code, message, details } } satisfies ErrorBody, status);
  }

  static badRequest(code: string, message: string, details: ErrorDetail[] = []): AppException {
    return new AppException(HttpStatus.BAD_REQUEST, code, message, details);
  }

  static unauthorized(code: string, message: string): AppException {
    return new AppException(HttpStatus.UNAUTHORIZED, code, message);
  }

  static forbidden(code: string, message: string): AppException {
    return new AppException(HttpStatus.FORBIDDEN, code, message);
  }

  static notFound(code: string, message: string): AppException {
    return new AppException(HttpStatus.NOT_FOUND, code, message);
  }

  static conflict(code: string, message: string): AppException {
    return new AppException(HttpStatus.CONFLICT, code, message);
  }
}
