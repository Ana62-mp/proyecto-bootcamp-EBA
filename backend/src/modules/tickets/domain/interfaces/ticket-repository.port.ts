import { Paginated } from '../../../../common/interfaces/paginated.interface';
import {
  ClienteParaTicket,
  EstadoTurno,
  NewTicketData,
  NumeroEstacion,
  ServicioParaTicket,
  TicketFilters,
  TicketRecord,
  TurnoChanges,
  VehiculoParaTicket,
} from '../types/ticket.types';

export const TICKET_REPOSITORY = Symbol('TICKET_REPOSITORY');

/** Operaciones disponibles dentro de una transacción de base de datos. */
export interface TicketTransactionPort {
  /** Serializa emisión, despacho y cambios de estado (lock transaccional). */
  lockTurnos(): Promise<void>;
  findByIdempotencyKey(actorId: string, idempotencyKey: string): Promise<TicketRecord | null>;
  findById(id: string): Promise<TicketRecord | null>;
  findCliente(id: string): Promise<ClienteParaTicket | null>;
  findVehiculo(id: string): Promise<VehiculoParaTicket | null>;
  findServicio(id: string): Promise<ServicioParaTicket | null>;
  vehicleHasActiveTurn(vehiculoId: string): Promise<boolean>;
  /** Incremento atómico del contador del día (YYYY-MM-DD). */
  nextSequence(fechaTurno: string): Promise<number>;
  /** Lanza DuplicateIdempotencyKeyError ante (actor, clave) repetida. */
  createTicket(data: NewTicketData): Promise<string>;
  occupiedStations(): Promise<NumeroEstacion[]>;
  pendingFifo(limit: number): Promise<string[]>;
  updateTurno(
    id: string,
    changes: TurnoChanges,
    historial: { estado: EstadoTurno; fecha: Date; usuarioId: string | null },
  ): Promise<void>;
}

export interface TicketRepositoryPort {
  runInTransaction<T>(work: (tx: TicketTransactionPort) => Promise<T>): Promise<T>;
  findByIdempotencyKey(actorId: string, idempotencyKey: string): Promise<TicketRecord | null>;
  findById(id: string): Promise<TicketRecord | null>;
  list(filters: TicketFilters, page: number, pageSize: number): Promise<Paginated<TicketRecord>>;
  listActive(): Promise<TicketRecord[]>;
}
