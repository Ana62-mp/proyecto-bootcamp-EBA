import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
  ValidateIf,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return value;
};

const toInt = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3001;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET debe tener al menos 32 caracteres' })
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN = '8h';

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRES_IN = '7d';

  /** Uno o varios orígenes del frontend separados por coma. */
  @IsString()
  @IsNotEmpty()
  FRONTEND_URL!: string;

  @IsIn(['lax', 'strict', 'none'])
  COOKIE_SAMESITE: 'lax' | 'strict' | 'none' = 'lax';

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  COOKIE_SECURE?: boolean;

  @IsString()
  COOKIE_PATH = '/';

  @Transform(toBoolean)
  @IsBoolean()
  COOKIE_PERSISTENT = false;

  @Transform(toBoolean)
  @IsBoolean()
  WEBSERVICES_EC_ENABLED = true;

  @IsUrl({ protocols: ['https'], require_protocol: true, require_tld: true })
  WEBSERVICES_EC_BASE_URL = 'https://webservices.ec/api';

  @ValidateIf((env: EnvironmentVariables) => env.WEBSERVICES_EC_ENABLED)
  @IsString()
  @IsNotEmpty({
    message: 'WEBSERVICES_EC_TOKEN es obligatorio cuando WEBSERVICES_EC_ENABLED=true',
  })
  WEBSERVICES_EC_TOKEN?: string;

  @Transform(toInt)
  @IsInt()
  @IsPositive()
  WEBSERVICES_EC_TIMEOUT_MS = 8000;

  /** Consultas de placa permitidas por actor y por minuto. */
  @Transform(toInt)
  @IsInt()
  @IsPositive()
  VEHICLE_LOOKUP_RATE_LIMIT_PER_MINUTE = 30;

  /** Vigencia del resultado del proveedor para registrar su procedencia al guardar. */
  @Transform(toInt)
  @IsInt()
  @IsPositive()
  VEHICLE_LOOKUP_SNAPSHOT_TTL_HOURS = 24;
}

export function validateConfig(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new Error(`Configuración de entorno inválida:\n- ${messages.join('\n- ')}`);
  }
  if (validated.COOKIE_SAMESITE === 'none' && validated.COOKIE_SECURE === false) {
    throw new Error('COOKIE_SAMESITE=none requiere COOKIE_SECURE=true (HTTPS).');
  }
  return validated;
}

export function parseAllowedOrigins(frontendUrl: string): string[] {
  return frontendUrl
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0);
}
