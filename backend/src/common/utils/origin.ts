/**
 * Valida el header Origin contra los orígenes permitidos o el mismo host de la petición.
 * Un Origin ausente se rechaza: los navegadores lo envían en POST y en handshakes WebSocket.
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
  requestHost?: string,
): boolean {
  if (!origin) return false;
  const normalized = origin.replace(/\/+$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  if (!requestHost) return false;
  try {
    return new URL(normalized).host === requestHost;
  } catch {
    return false;
  }
}
