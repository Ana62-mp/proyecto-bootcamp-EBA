/**
 * Ejemplo de integración del frontend con la emisión de tickets (§12).
 * No depende de un framework: adaptar renderTicket, onConnectionError y getAccessToken.
 * Requiere `npm install socket.io-client` en el frontend. El WebSocket nativo del navegador
 * no es compatible con el protocolo Socket.IO.
 */
import { io, Socket } from 'socket.io-client';

// ---------- Tipos del contrato (§11) ----------

export type EstadoTurno =
  'EN_ESPERA' | 'LAVANDO' | 'SECANDO_PULIENDO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export interface EmitirTicketDto {
  clienteId: string;
  vehiculoId: string;
  servicioLavadoId: string;
  /** Solo para administradores: máquina destino. */
  machineId?: string;
}

export interface TicketResponse {
  ticketId: string;
  numeroTurno: string;
  /** ISO 8601 UTC; mostrar en America/Guayaquil. */
  emitidoEn: string;
  estado: 'EMITIDO' | 'ANULADO';
  estadoPago: 'PENDIENTE';
  estadoTurno: EstadoTurno;
  numeroEstacion: 1 | 2 | null;
  cliente: {
    id: string;
    nombre: string;
    tipoDocumento: 'CEDULA' | 'PASAPORTE' | 'RUC';
    numeroDocumento: string;
  };
  vehiculo: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    color: string;
    tipoVehiculo: 'AUTOMOVIL' | 'SUV' | 'CAMIONETA' | 'OTRO';
  };
  servicio: { id: string; nombre: string; precio: string; moneda: string };
  mensaje: string;
}

export interface TicketEmissionEvent {
  eventId: string;
  requestId: string;
  occurredAt: string;
  ticket: TicketResponse;
}

export interface ApiError {
  error: { code: string; message: string; details: Array<{ field?: string; message: string }> };
}

export interface EmissionClientOptions {
  apiUrl: string;
  /** Devuelve el access token actual, guardado solo en memoria. */
  getAccessToken: () => string;
  renderTicket: (ticket: TicketResponse) => void;
  onConnectionError?: (error: Error) => void;
  /** Solo administradores: máquina destino. */
  machineId?: string;
  /** Tiempo máximo de espera de `emision:ready` antes de emitir solo por HTTP. */
  readyTimeoutMs?: number;
}

const MAX_RENDERED_IDS = 200;

export class TicketEmissionClient {
  private readonly socket: Socket;
  private ready = false;
  private readonly renderedIds = new Set<string>();

  constructor(private readonly options: EmissionClientOptions) {
    this.socket = io(`${options.apiUrl}/tickets-emision`, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: this.handshakeAuth(),
      autoConnect: false,
    });

    // Los listeners se registran antes de conectar y antes de cualquier POST.
    this.socket.on('emision:ready', () => {
      this.ready = true;
    });
    this.socket.on('disconnect', () => {
      this.ready = false;
    });
    this.socket.on('connect_error', (error: Error) => {
      this.ready = false;
      options.onConnectionError?.(error);
    });
    this.socket.on('ticket:emitido', ({ ticket }: TicketEmissionEvent) => this.renderOnce(ticket));
  }

  connect(): void {
    this.socket.connect();
  }

  /** Llamar después de renovar el access token por HTTP. */
  reconnectWithFreshToken(): void {
    this.socket.auth = this.handshakeAuth();
    this.socket.disconnect().connect();
  }

  /** Al desmontar la pantalla: quita listeners y cierra la conexión. */
  dispose(): void {
    this.socket.removeAllListeners();
    this.socket.disconnect();
  }

  /**
   * Emite un ticket. Generar `requestId = crypto.randomUUID()` al empezar la operación y
   * conservarlo para reintentarla (incluso después de reconectar). Si se pierde la respuesta,
   * reintentar con la misma clave y el mismo body recupera el ticket guardado.
   */
  async emitirTicket(body: EmitirTicketDto, requestId: string): Promise<TicketResponse> {
    await this.waitUntilReady();
    const response = await fetch(`${this.options.apiUrl}/api/tickets/emision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.getAccessToken()}`,
        'Idempotency-Key': requestId,
      },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as { data: TicketResponse } | ApiError;
    if (!response.ok || !('data' in result)) {
      const message = 'error' in result ? result.error.message : 'No se pudo emitir el ticket';
      throw new Error(message);
    }
    // También funciona si el evento no llegó o llegó antes que la respuesta.
    this.renderOnce(result.data);
    return result.data;
  }

  private renderOnce(ticket: TicketResponse): void {
    if (this.renderedIds.has(ticket.ticketId)) return;
    this.renderedIds.add(ticket.ticketId);
    if (this.renderedIds.size > MAX_RENDERED_IDS) {
      // Set conserva el orden de inserción: se elimina el ID más antiguo.
      for (const oldest of this.renderedIds) {
        this.renderedIds.delete(oldest);
        break;
      }
    }
    this.options.renderTicket(ticket);
  }

  /** Espera `emision:ready` con un tiempo máximo; la emisión nunca depende del socket. */
  private waitUntilReady(): Promise<void> {
    if (this.ready || !this.socket.active) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(done, this.options.readyTimeoutMs ?? 2000);
      this.socket.once('emision:ready', done);
      function done() {
        clearTimeout(timer);
        resolve();
      }
    });
  }

  private handshakeAuth(): { token: string; machineId?: string } {
    return {
      token: this.options.getAccessToken(),
      ...(this.options.machineId ? { machineId: this.options.machineId } : {}),
    };
  }
}

/*
Uso en el kiosko:

  const client = new TicketEmissionClient({
    apiUrl: 'http://localhost:3001',
    getAccessToken: () => session.accessToken,
    renderTicket: (ticket) => mostrarComprobante(ticket), // el botón Imprimir usa estos datos
    onConnectionError: () => mostrarAviso('Sin conexión en tiempo real; el ticket se emite igual.'),
  });
  client.connect();

  const requestId = crypto.randomUUID();
  botonEmitir.disabled = true;
  try {
    await client.emitirTicket({ clienteId, vehiculoId, servicioLavadoId }, requestId);
  } finally {
    botonEmitir.disabled = false;
  }
*/
