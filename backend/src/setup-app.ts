import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { validationExceptionFactory } from './common/utils/validation';
import { parseAllowedOrigins } from './context/config/app.config';
import { AppSocketIoAdapter } from './context/websocket/socket-io.adapter';

/** Configuración compartida por main.ts y las pruebas e2e. */
export function setupApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService);
  const allowedOrigins = parseAllowedOrigins(config.getOrThrow<string>('FRONTEND_URL'));

  app.setGlobalPrefix('api');
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.useBodyParser('json', { limit: '100kb' });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useWebSocketAdapter(new AppSocketIoAdapter(app, allowedOrigins));
  app.set('trust proxy', 1);
  app.enableShutdownHooks();
}
