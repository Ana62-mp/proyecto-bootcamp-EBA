export const BUSINESS_TIME_ZONE = 'America/Guayaquil';

/** Fecha calendario (YYYY-MM-DD) del instante dado en America/Guayaquil. */
export function businessDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** YYYY-MM-DD → Date a medianoche UTC, para columnas @db.Date sin desplazamientos. */
export function dateOnlyToDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function dateToDateOnly(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}
