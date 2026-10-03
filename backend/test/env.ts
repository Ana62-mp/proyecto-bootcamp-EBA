import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Carga .env.test para las pruebas e2e. Exige una base separada cuyo nombre contenga "test"
 * para no truncar nunca la base de desarrollo o producción.
 */
export function loadTestEnv(): void {
  const file = join(__dirname, '..', '.env.test');
  if (!existsSync(file)) {
    throw new Error(
      'Falta backend/.env.test (copiar .env.example y apuntar a una base de pruebas).',
    );
  }
  config({ path: file, override: true, quiet: true });

  process.env.NODE_ENV = 'test';
  // Las pruebas automatizadas nunca consumen consultas reales del proveedor.
  process.env.WEBSERVICES_EC_ENABLED = 'false';
  process.env.WEBSERVICES_EC_TOKEN = '';

  const dbName = new URL(process.env.DATABASE_URL ?? 'postgresql://x/none').pathname.slice(1);
  if (!/test/i.test(dbName)) {
    throw new Error(
      `DATABASE_URL de pruebas debe apuntar a una base "*test*" (actual: "${dbName}").`,
    );
  }
}
