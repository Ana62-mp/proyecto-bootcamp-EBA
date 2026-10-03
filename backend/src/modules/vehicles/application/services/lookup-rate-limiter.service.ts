import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const WINDOW_MS = 60_000;
const MAX_TRACKED_ACTORS = 10_000;

/**
 * Límite de consultas de placa por actor con ventana deslizante de un minuto.
 * En memoria: válido para una sola instancia (ver README, despliegue).
 */
@Injectable()
export class LookupRateLimiterService {
  private readonly limit: number;
  private readonly hits = new Map<string, number[]>();

  constructor(config: ConfigService) {
    this.limit = config.getOrThrow<number>('VEHICLE_LOOKUP_RATE_LIMIT_PER_MINUTE');
  }

  /** Registra una consulta y devuelve false si el actor superó el límite. */
  tryConsume(actorId: string, now = Date.now()): boolean {
    const recent = (this.hits.get(actorId) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= this.limit) {
      this.hits.set(actorId, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(actorId, recent);
    if (this.hits.size > MAX_TRACKED_ACTORS) this.prune(now);
    return true;
  }

  private prune(now: number): void {
    for (const [actor, times] of this.hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) this.hits.delete(actor);
    }
  }
}
