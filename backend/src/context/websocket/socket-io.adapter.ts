import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { IncomingMessage } from 'node:http';
import type { Server, ServerOptions } from 'socket.io';
import { isOriginAllowed } from '../../common/utils/origin';

/**
 * Socket.IO en el mismo host y puerto que HTTP, path /socket.io, solo transporte websocket.
 * CORS no restringe conexiones WebSocket: allowRequest valida Origin en el handshake/upgrade.
 */
export class AppSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly allowedOrigins: string[],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      path: '/socket.io',
      transports: ['websocket'],
      serveClient: false,
      cors: { origin: this.allowedOrigins, credentials: true },
      allowRequest: (
        req: IncomingMessage,
        callback: (err: string | null | undefined, success: boolean) => void,
      ) => {
        callback(null, isOriginAllowed(req.headers.origin, this.allowedOrigins, req.headers.host));
      },
    }) as Server;
    return server;
  }
}
