import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppException, ErrorBody } from '../errors/app.exception';

const DEFAULT_CODES: Record<number, string> = {
  400: 'INVALID_INPUT',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'TOO_MANY_REQUESTS',
};

const DEFAULT_MESSAGES: Record<number, string> = {
  401: 'Sesión inválida o expirada.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'Recurso no encontrado.',
  413: 'La petición es demasiado grande.',
};

/** Formato estable de error HTTP: { error: { code, message, details } }. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') return;
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body: ErrorBody = {
        error: {
          code: DEFAULT_CODES[status] ?? 'HTTP_ERROR',
          message: DEFAULT_MESSAGES[status] ?? 'Solicitud inválida.',
          details: [],
        },
      };
      response.status(status).json(body);
      return;
    }

    // Solo nombre y código: sin stack trace ni datos de la petición en logs.
    const name = exception instanceof Error ? exception.name : typeof exception;
    const code =
      typeof exception === 'object' && exception !== null && 'code' in exception
        ? String(exception.code)
        : 'n/a';
    this.logger.error(`Error inesperado (${name}, code=${code})`);
    const body: ErrorBody = {
      error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado.', details: [] },
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
