import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { isOriginAllowed } from '../../../../common/utils/origin';
import { parseAllowedOrigins } from '../../../../context/config/app.config';
import {
  ChannelAuthError,
  EmissionChannelAuthService,
  EmissionChannelIdentity,
} from '../../application/services/emission-channel-auth.service';
import type { TicketEmitidoEvent } from '../../domain/types/ticket-comprobante.types';

export const TICKETS_EMISION_NAMESPACE = '/tickets-emision';
export const TICKET_EMITIDO_EVENT = 'ticket:emitido';
export const EMISION_READY_EVENT = 'emision:ready';

export const machineRoom = (machineId: string): string => `machine:${machineId}`;

interface SocketData {
  identity?: EmissionChannelIdentity;
  expiryTimer?: NodeJS.Timeout;
}

/** socket.data es `any` en socket.io; se tipa explícitamente aquí. */
const dataOf = (socket: Socket): SocketData => socket.data as SocketData;

/**
 * Canal exclusivo de notificación de tickets emitidos (§11.4).
 * No tiene handlers de mensajes del cliente: los tickets solo se crean por HTTP.
 */
@WebSocketGateway({ namespace: TICKETS_EMISION_NAMESPACE, transports: ['websocket'] })
export class TicketsEmisionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(TicketsEmisionGateway.name);
  private readonly allowedOrigins: string[];

  @WebSocketServer()
  private readonly namespace!: Namespace;

  constructor(
    private readonly auth: EmissionChannelAuthService,
    config: ConfigService,
  ) {
    this.allowedOrigins = parseAllowedOrigins(config.getOrThrow<string>('FRONTEND_URL'));
  }

  afterInit(namespace: Namespace): void {
    // Middleware del namespace: se ejecuta antes de 'connection' y de unir rooms.
    namespace.use((socket: Socket, next) => {
      const { origin, host } = socket.handshake.headers;
      if (!isOriginAllowed(origin, this.allowedOrigins, host)) {
        return next(this.connectError('ORIGIN_NOT_ALLOWED'));
      }
      const auth = (socket.handshake.auth ?? {}) as { token?: unknown; machineId?: unknown };
      this.auth
        .authenticate(auth.token, auth.machineId)
        .then((identity) => {
          dataOf(socket).identity = identity;
          next();
        })
        .catch((error: unknown) => {
          next(this.connectError(error instanceof ChannelAuthError ? error.code : 'UNAUTHORIZED'));
        });
    });
  }

  async handleConnection(socket: Socket): Promise<void> {
    const data = dataOf(socket);
    const identity = data.identity;
    if (!identity) {
      socket.disconnect(true);
      return;
    }
    const remaining = identity.expiresAt - Date.now();
    if (remaining <= 0) {
      socket.disconnect(true);
      return;
    }
    // Al expirar el token: el cliente renueva por HTTP y reconecta con el nuevo token.
    data.expiryTimer = setTimeout(() => socket.disconnect(true), remaining);

    await socket.join(machineRoom(identity.machineId));
    socket.emit(EMISION_READY_EVENT, { machineId: identity.machineId });
  }

  handleDisconnect(socket: Socket): void {
    const { expiryTimer } = dataOf(socket);
    if (expiryTimer) clearTimeout(expiryTimer);
  }

  /** Solo emisión a la room de la máquina; nunca server.emit() global (datos personales). */
  emitTicketEmitido(machineId: string, event: TicketEmitidoEvent): void {
    this.namespace.to(machineRoom(machineId)).emit(TICKET_EMITIDO_EVENT, event);
  }

  private connectError(code: string): Error & { data: { code: string } } {
    this.logger.debug(`Handshake rechazado: ${code}`);
    return Object.assign(new Error(code), { data: { code } });
  }
}
