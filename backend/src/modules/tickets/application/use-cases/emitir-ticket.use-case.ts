import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { AppException } from '../../../../common/errors/app.exception';
import { businessDate } from '../../../../common/utils/timezone';
import { nombreCliente } from '../../../clientes/domain/types/cliente.types';
import { USUARIO_REPOSITORY } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import { TICKET_EMISSION_NOTIFIER } from '../../domain/interfaces/ticket-emission-notifier.port';
import type { TicketEmissionNotifierPort } from '../../domain/interfaces/ticket-emission-notifier.port';
import { TICKET_REPOSITORY } from '../../domain/interfaces/ticket-repository.port';
import type {
  TicketRepositoryPort,
  TicketTransactionPort,
} from '../../domain/interfaces/ticket-repository.port';
import { toComprobante } from '../../domain/types/ticket-comprobante.types';
import {
  DuplicateIdempotencyKeyError,
  EmitirTicketCommand,
  TicketRecord,
} from '../../domain/types/ticket.types';
import { formatNumeroTurno } from '../../domain/turno-state-machine';
import { TurnoDispatcherService } from '../services/turno-dispatcher.service';

export interface EmitirTicketResult {
  ticket: TicketRecord;
  replayed: boolean;
}

type TxOutcome = { ticket: TicketRecord; replayed: boolean };

/**
 * Emisión de ticket de lavado (§11.3):
 * 1. Valida actor/máquina. 2. Transacción con lock: idempotencia, validaciones,
 * contador atómico, ticket y despacho FIFO. 3. Solo tras el commit notifica `ticket:emitido`.
 * Un fallo de notificación nunca revierte el ticket ni cambia la respuesta HTTP.
 */
@Injectable()
export class EmitirTicketUseCase {
  private readonly logger = new Logger(EmitirTicketUseCase.name);

  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(TICKET_EMISSION_NOTIFIER) private readonly notifier: TicketEmissionNotifierPort,
    private readonly dispatcher: TurnoDispatcherService,
  ) {}

  async execute(cmd: EmitirTicketCommand): Promise<EmitirTicketResult> {
    const machineId = await this.resolveMachine(cmd);
    const fingerprint = this.fingerprint(cmd, machineId);

    // Reintento rápido sin tomar el lock.
    const previous = await this.tickets.findByIdempotencyKey(cmd.actor.id, cmd.idempotencyKey);
    if (previous) return this.replay(previous, fingerprint);

    let outcome: TxOutcome;
    try {
      outcome = await this.tickets.runInTransaction((tx) =>
        this.emitInTransaction(tx, cmd, machineId, fingerprint),
      );
    } catch (error) {
      if (!(error instanceof DuplicateIdempotencyKeyError)) throw error;
      // Carrera con otra petición con la misma clave: recuperar el ticket persistido.
      const concurrent = await this.tickets.findByIdempotencyKey(cmd.actor.id, cmd.idempotencyKey);
      if (!concurrent) throw error;
      return this.replay(concurrent, fingerprint);
    }

    if (outcome.replayed) return this.replay(outcome.ticket, fingerprint);

    this.notifyAfterCommit(outcome.ticket, cmd.idempotencyKey);
    return { ticket: outcome.ticket, replayed: false };
  }

  private async emitInTransaction(
    tx: TicketTransactionPort,
    cmd: EmitirTicketCommand,
    machineId: string,
    fingerprint: string,
  ): Promise<TxOutcome> {
    await tx.lockTurnos();

    const existing = await tx.findByIdempotencyKey(cmd.actor.id, cmd.idempotencyKey);
    if (existing) return { ticket: existing, replayed: true };

    const cliente = await tx.findCliente(cmd.clienteId);
    if (!cliente)
      throw AppException.notFound('CLIENTE_NO_ENCONTRADO', 'El cliente seleccionado no existe.');
    if (!cliente.activo)
      throw AppException.conflict('CLIENTE_INACTIVO', 'El cliente se encuentra desactivado.');

    const vehiculo = await tx.findVehiculo(cmd.vehiculoId);
    if (!vehiculo)
      throw AppException.notFound('VEHICULO_NO_ENCONTRADO', 'El vehículo seleccionado no existe.');
    if (vehiculo.clienteId !== cliente.id) {
      throw AppException.conflict(
        'VEHICULO_NO_PERTENECE_AL_CLIENTE',
        'El vehículo seleccionado no está asociado a este cliente.',
      );
    }
    if (!vehiculo.activo)
      throw AppException.conflict('VEHICULO_INACTIVO', 'El vehículo se encuentra desactivado.');

    const servicio = await tx.findServicio(cmd.servicioLavadoId);
    if (!servicio)
      throw AppException.notFound('SERVICIO_NO_ENCONTRADO', 'El servicio seleccionado no existe.');
    if (!servicio.activo)
      throw AppException.conflict(
        'SERVICIO_INACTIVO',
        'El servicio seleccionado no está disponible.',
      );

    if (await tx.vehicleHasActiveTurn(vehiculo.id)) {
      throw AppException.conflict(
        'VEHICULO_CON_TURNO_ACTIVO',
        'Este vehículo ya tiene un turno activo en el sistema.',
      );
    }

    const now = new Date();
    const fechaTurno = businessDate(now);
    const secuencia = await tx.nextSequence(fechaTurno);

    const ticketId = await tx.createTicket({
      numeroTurno: formatNumeroTurno(fechaTurno, secuencia),
      fechaTurno,
      secuencia,
      emitidoEn: now,
      clienteId: cliente.id,
      vehiculoId: vehiculo.id,
      servicioId: servicio.id,
      emitidoPorId: cmd.actor.id,
      machineId,
      idempotencyKey: cmd.idempotencyKey,
      requestFingerprint: fingerprint,
      // Precio y datos del comprobante siempre desde la base de datos.
      precio: servicio.precio,
      moneda: servicio.moneda,
      servicioNombre: servicio.nombre,
      clienteNombre: nombreCliente(cliente),
      clienteTipoDocumento: cliente.tipoDocumento,
      clienteNumeroDocumento: cliente.numeroDocumento,
      vehiculoPlaca: vehiculo.placa,
      vehiculoMarca: vehiculo.marca,
      vehiculoModelo: vehiculo.modelo,
      vehiculoColor: vehiculo.color,
      vehiculoTipo: vehiculo.tipoVehiculo,
    });

    await this.dispatcher.dispatch(tx, cmd.actor.id, now);

    const ticket = await tx.findById(ticketId);
    if (!ticket) throw new Error('Ticket recién creado no encontrado');
    return { ticket, replayed: false };
  }

  /** Máquina: siempre su propia identidad. Admin: máquina destino validada explícitamente. */
  private async resolveMachine(cmd: EmitirTicketCommand): Promise<string> {
    const actor = await this.usuarios.findById(cmd.actor.id);
    if (!actor || !actor.activo || actor.rol !== cmd.actor.rol) {
      throw AppException.forbidden(
        'ACTOR_INACTIVO',
        'La cuenta que emite el ticket no está activa.',
      );
    }

    if (actor.rol === 'MAQUINA') {
      if (cmd.machineId && cmd.machineId !== actor.id) {
        throw AppException.forbidden(
          'MACHINE_NOT_AUTHORIZED',
          'Una máquina solo puede emitir tickets para sí misma.',
        );
      }
      return actor.id;
    }

    if (actor.rol === 'ADMIN') {
      if (!cmd.machineId) {
        throw AppException.badRequest(
          'MACHINE_ID_REQUIRED',
          'Selecciona la máquina destino del ticket.',
          [{ field: 'machineId', message: 'Obligatorio para administradores.' }],
        );
      }
      const machine = await this.usuarios.findById(cmd.machineId);
      if (!machine || machine.rol !== 'MAQUINA' || !machine.activo) {
        throw AppException.forbidden(
          'MACHINE_NOT_AUTHORIZED',
          'La máquina destino no existe o no está activa.',
        );
      }
      return machine.id;
    }

    throw AppException.forbidden('FORBIDDEN', 'No tienes permisos para emitir tickets.');
  }

  private fingerprint(cmd: EmitirTicketCommand, machineId: string): string {
    const canonical = JSON.stringify([
      cmd.clienteId,
      cmd.vehiculoId,
      cmd.servicioLavadoId,
      machineId,
    ]);
    return createHash('sha256').update(canonical).digest('hex');
  }

  private replay(existing: TicketRecord, fingerprint: string): EmitirTicketResult {
    if (existing.requestFingerprint !== fingerprint) {
      throw AppException.conflict(
        'IDEMPOTENCY_KEY_REUSED',
        'La Idempotency-Key ya se usó con datos diferentes.',
      );
    }
    // Reintento: devuelve el ticket existente y no emite un nuevo evento.
    return { ticket: existing, replayed: true };
  }

  private notifyAfterCommit(ticket: TicketRecord, requestId: string): void {
    try {
      this.notifier.notifyTicketEmitido(ticket.machineId, {
        eventId: randomUUID(),
        requestId,
        occurredAt: new Date().toISOString(),
        ticket: toComprobante(ticket),
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : 'Error';
      this.logger.warn(`No se pudo notificar ticket:emitido (ticketId=${ticket.id}, ${name})`);
    }
  }
}
