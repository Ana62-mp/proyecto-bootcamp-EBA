import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse, isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import type { VehicleLookupPort } from '../../domain/interfaces/vehicle-lookup.port';
import {
  ProviderLookupOutcome,
  VehicleProviderError,
} from '../../domain/types/vehicle-lookup.types';
import { parseProviderBody } from './webservices-ec.mapper';

const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT', 'ERR_CANCELED']);

/**
 * Adapter de VehicleLookupPort contra webservices.ec (proveedor externo, no la ANT/SRI).
 * Conserva el nombre AntService para reutilizar la integración existente.
 * El token solo vive en el backend; nunca se registra el header Authorization ni el error Axios completo.
 */
@Injectable()
export class AntService implements VehicleLookupPort {
  private readonly logger = new Logger(AntService.name);
  private readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.enabled = config.get<boolean>('WEBSERVICES_EC_ENABLED') ?? false;
    this.baseUrl = config.getOrThrow<string>('WEBSERVICES_EC_BASE_URL').replace(/\/+$/, '');
    this.token = config.get<string>('WEBSERVICES_EC_TOKEN') ?? '';
    this.timeoutMs = config.getOrThrow<number>('WEBSERVICES_EC_TIMEOUT_MS');
  }

  isEnabled(): boolean {
    return this.enabled && this.token.length > 0;
  }

  async lookup(
    providerQuery: string,
    expectedLicensePlate: string,
  ): Promise<ProviderLookupOutcome> {
    if (!this.isEnabled()) throw new VehicleProviderError('UNAVAILABLE');

    let response: AxiosResponse<unknown>;
    try {
      response = await firstValueFrom(
        this.http.get<unknown>(`${this.baseUrl}/placas/${encodeURIComponent(providerQuery)}`, {
          headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
          timeout: this.timeoutMs,
          maxRedirects: 0,
          validateStatus: () => true,
        }),
      );
    } catch (error) {
      const code = isAxiosError(error) ? error.code : undefined;
      if (code && TIMEOUT_CODES.has(code)) {
        this.logger.warn('webservices.ec: timeout');
        throw new VehicleProviderError('TIMEOUT');
      }
      this.logger.warn(`webservices.ec: error de red (${code ?? 'desconocido'})`);
      throw new VehicleProviderError('UNAVAILABLE');
    }

    const { status } = response;
    if (status === 404) return { found: false };
    if ([401, 402, 403, 429].includes(status) || status >= 500) {
      // Cuota, caída o credencial externa rechazada: no es un 401 del usuario del Car Wash.
      this.logger.warn(`webservices.ec: respuesta HTTP ${status}`);
      throw new VehicleProviderError('UNAVAILABLE', status);
    }
    if (status < 200 || status >= 300) {
      this.logger.warn(`webservices.ec: respuesta HTTP no clasificable ${status}`);
      throw new VehicleProviderError('INVALID_RESPONSE', status);
    }

    let body = response.data;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body) as unknown;
      } catch {
        throw new VehicleProviderError('INVALID_RESPONSE', status);
      }
    }

    const parsed = parseProviderBody(body, expectedLicensePlate);
    return parsed.kind === 'FOUND' ? { found: true, data: parsed.data } : { found: false };
  }
}
