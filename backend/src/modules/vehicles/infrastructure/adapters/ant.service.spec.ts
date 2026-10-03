import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { VehicleProviderError } from '../../domain/types/vehicle-lookup.types';
import { AntService } from './ant.service';

// Token ficticio: las pruebas nunca usan el token real ni consumen consultas.
const FAKE_TOKEN = 'token-de-prueba';

function makeConfig(overrides: Record<string, unknown> = {}): ConfigService {
  const values: Record<string, unknown> = {
    WEBSERVICES_EC_ENABLED: true,
    WEBSERVICES_EC_BASE_URL: 'https://webservices.ec/api/',
    WEBSERVICES_EC_TOKEN: FAKE_TOKEN,
    WEBSERVICES_EC_TIMEOUT_MS: 8000,
    ...overrides,
  };
  return {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => values[key],
  } as unknown as ConfigService;
}

function response(status: number, data: unknown): AxiosResponse<unknown> {
  return { status, data, statusText: '', headers: {}, config: {} as never };
}

function makeService(get: jest.Mock, config = makeConfig()): AntService {
  return new AntService({ get } as unknown as HttpService, config);
}

async function expectKind(promise: Promise<unknown>, kind: string): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(VehicleProviderError);
  await promise.catch((e: VehicleProviderError) => expect(e.kind).toBe(kind));
}

describe('AntService (adapter webservices.ec)', () => {
  it('consulta el host fijo con Bearer desde configuración y timeout', async () => {
    const get = jest
      .fn()
      .mockReturnValue(
        of(response(200, { status: true, data: { Placa: 'IA-7000', Marca: 'HINO' } })),
      );
    const result = await makeService(get).lookup('IA-7000', 'IA7000');

    expect(get).toHaveBeenCalledWith(
      'https://webservices.ec/api/placas/IA-7000',
      expect.objectContaining({
        headers: { Authorization: `Bearer ${FAKE_TOKEN}`, Accept: 'application/json' },
        timeout: 8000,
        maxRedirects: 0,
      }),
    );
    expect(result).toEqual({ found: true, data: expect.objectContaining({ brand: 'HINO' }) });
  });

  it('codifica la consulta en la URL', async () => {
    const get = jest.fn().mockReturnValue(of(response(404, {})));
    await makeService(get).lookup('A/B?C', 'X');
    expect(get.mock.calls[0][0]).toBe('https://webservices.ec/api/placas/A%2FB%3FC');
  });

  it('404 del proveedor es ausencia confirmada', async () => {
    const get = jest.fn().mockReturnValue(of(response(404, { status: false })));
    await expect(makeService(get).lookup('PBH1234', 'PBH1234')).resolves.toEqual({ found: false });
  });

  it.each([401, 402, 403, 429, 500, 503])(
    'HTTP %i → UNAVAILABLE (no se propaga como 401 del usuario)',
    async (status) => {
      const get = jest.fn().mockReturnValue(of(response(status, {})));
      await expectKind(makeService(get).lookup('PBH1234', 'PBH1234'), 'UNAVAILABLE');
    },
  );

  it('HTTP no clasificable → INVALID_RESPONSE', async () => {
    const get = jest.fn().mockReturnValue(of(response(418, {})));
    await expectKind(makeService(get).lookup('PBH1234', 'PBH1234'), 'INVALID_RESPONSE');
  });

  it('JSON inválido → INVALID_RESPONSE', async () => {
    const get = jest.fn().mockReturnValue(of(response(200, '<html>no json</html>')));
    await expectKind(makeService(get).lookup('PBH1234', 'PBH1234'), 'INVALID_RESPONSE');
  });

  it('timeout → TIMEOUT', async () => {
    const error = new AxiosError('timeout', 'ECONNABORTED');
    const get = jest.fn().mockReturnValue(throwError(() => error));
    await expectKind(makeService(get).lookup('PBH1234', 'PBH1234'), 'TIMEOUT');
  });

  it('error de red → UNAVAILABLE', async () => {
    const error = new AxiosError('refused', 'ECONNREFUSED');
    const get = jest.fn().mockReturnValue(throwError(() => error));
    await expectKind(makeService(get).lookup('PBH1234', 'PBH1234'), 'UNAVAILABLE');
  });

  it('deshabilitado o sin token → UNAVAILABLE sin llamar al proveedor', async () => {
    const get = jest.fn();
    const service = makeService(get, makeConfig({ WEBSERVICES_EC_TOKEN: '' }));
    expect(service.isEnabled()).toBe(false);
    await expectKind(service.lookup('PBH1234', 'PBH1234'), 'UNAVAILABLE');
    expect(get).not.toHaveBeenCalled();
  });
});
