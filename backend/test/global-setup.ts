import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { loadTestEnv } from './env';

/** Aplica las migraciones a la base de pruebas antes de la suite e2e. */
export default function globalSetup(): void {
  loadTestEnv();
  execSync('npx prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
}
