import { Prisma } from '../../generated/prisma/client';

export type PrismaTx = Prisma.TransactionClient;

/** Detecta violaciones de restricción única (P2002), opcionalmente por campo involucrado. */
export function isUniqueViolation(error: unknown, field?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  if (!field) return true;
  return JSON.stringify(error.meta ?? {}).includes(field);
}
