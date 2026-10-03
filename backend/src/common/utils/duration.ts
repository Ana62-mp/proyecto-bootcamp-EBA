const UNITS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Convierte duraciones tipo "8h", "7d", "30m" o segundos numéricos a milisegundos. */
export function durationToMs(value: string): number {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(trimmed);
  if (!match) throw new Error(`Duración inválida: ${value}`);
  return Number(match[1]) * UNITS[match[2].toLowerCase()];
}
