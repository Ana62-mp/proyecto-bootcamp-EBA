/**
 * Cliente HTTP del backend Car Wash.
 * - El access token vive solo en memoria (nunca en localStorage).
 * - El refresh token viaja en una cookie httpOnly; ante un 401 se renueva una vez y se reintenta.
 * - Los errores del backend ({ error: { code, message, details } }) se lanzan como ApiError.
 */

/** Vacío = mismo origen (proxy de Vite en desarrollo). */
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '');

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details: ApiErrorDetail[] = []
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface SessionPayload {
  accessToken: string;
  expiresIn: number;
  user: UsuarioDto;
}

export interface UsuarioDto {
  id: string;
  usuario: string;
  nombreVisible: string;
  rol: 'ADMIN' | 'MAQUINA' | 'LAVADOR';
  activo: boolean;
  codigo: string | null;
  ubicacion: string | null;
  estacionPreferida: 1 | 2 | null;
}

let accessToken: string | null = null;
let refreshInFlight: Promise<SessionPayload | null> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export const session = {
  setToken(token: string | null): void {
    accessToken = token;
  },
  hasToken(): boolean {
    return accessToken !== null;
  },
  /** Se invoca cuando la sesión no se puede renovar (por ejemplo, usuario desactivado). */
  onExpired(handler: (() => void) | null): void {
    sessionExpiredHandler = handler;
  }
};

type Query = Record<string, string | number | boolean | null | undefined | string[]>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  headers?: Record<string, string>;
  /** false para rutas públicas (login/refresh/logout). */
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const qs = params.toString();
  return `${API_BASE}/api${path}${qs ? `?${qs}` : ''}`;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string; details?: ApiErrorDetail[] };
    };
    if (body.error) {
      const details = body.error.details ?? [];
      // Para validaciones mostramos el primer detalle concreto, más útil que el mensaje genérico.
      const message =
        body.error.code === 'INVALID_INPUT' && details[0]?.message
          ? details[0].message
          : body.error.message ?? 'Ocurrió un error.';
      return new ApiError(message, response.status, body.error.code ?? 'HTTP_ERROR', details);
    }
  } catch {
    // cuerpo no JSON
  }
  return new ApiError(
    response.status === 0 ? 'No se pudo conectar con el servidor.' : `Error del servidor (${response.status}).`,
    response.status,
    'HTTP_ERROR'
  );
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.auth !== false && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      signal: options.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.',
      0,
      'NETWORK_ERROR'
    );
  }
}

/** Renueva la sesión con la cookie de refresh. Comparte una sola petición entre llamadas concurrentes. */
export function refreshSession(): Promise<SessionPayload | null> {
  refreshInFlight ??= (async () => {
    try {
      const response = await send('/auth/refresh', { method: 'POST', auth: false });
      if (!response.ok) return null;
      const { data } = (await response.json()) as { data: SessionPayload };
      accessToken = data.accessToken;
      return data;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && options.auth !== false) {
    const renewed = await refreshSession();
    if (!renewed) {
      accessToken = null;
      sessionExpiredHandler?.();
      throw await parseError(response);
    }
    response = await send(path, options);
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
