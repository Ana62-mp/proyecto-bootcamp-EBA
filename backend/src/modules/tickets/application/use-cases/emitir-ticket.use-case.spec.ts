import { AppException } from '../../../../common/errors/app.exception';
import { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { paginate, Paginated } from '../../../../common/interfaces/paginated.interface';
import type { UsuarioRepositoryPort } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import { UsuarioRecord } from '../../../usuarios/domain/types/usuario.types';
import type { TicketEmitidoEvent } from '../../domain/types/ticket-comprobante.types';
import type { TicketEmissionNotifierPort } from '../../domain/interfaces/ticket-emission-notifier.port';
import type {
  TicketRepositoryPort,
  TicketTransactionPort,
} from '../../domain/interfaces/ticket-repository.port';
import {
  ClienteParaTicket,
  DuplicateIdempotencyKeyError,
  ESTADOS_ACTIVOS,
  ESTADOS_EN_ESTACION,
  NewTicketData,
  NumeroEstacion,
  ServicioParaTicket,
  TicketRecord,
  VehiculoParaTicket,
} from '../../domain/types/ticket.types';
import { TurnoDispatcherService } from '../services/turno-dispatcher.service';
import { EmitirTicketUseCase } from './emitir-ticket.use-case';

const MAQUINA_1 = '10000000-0000-4000-8000-000000000001';
const MAQUINA_2 = '10000000-0000-4000-8000-000000000002';
const ADMIN = '10000000-0000-4000-8000-0000000000aa';
const CLIENTE = '20000000-0000-4000-8000-000000000001';
const OTRO_CLIENTE = '20000000-0000-4000-8000-000000000002';
const VEHICULO = '30000000-0000-4000-8000-000000000001';
const VEHICULO_2 = '30000000-0000-4000-8000-000000000002';
const SERVICIO = '40000000-0000-4000-8000-000000000001';
const SERVICIO_INACTIVO = '40000000-0000-4000-8000-000000000002';
const KEY = '50000000-0000-4000-8000-000000000001';

/**
 * Repositorio en memoria: las transacciones se serializan (como pg_advisory_xact_lock),
 * trabajan sobre una copia y solo se confirman si no hay error (rollback en caso contrario).
 */
class InMemoryTicketRepository implements TicketRepositoryPort {
  tickets: TicketRecord[] = [];
  counters = new Map<string, number>();
  clientes = new Map<string, ClienteParaTicket>();
  vehiculos = new Map<string, VehiculoParaTicket>();
  servicios = new Map<string, ServicioParaTicket>();
  failAfterCreate = false;
  commits = 0;
  private queue: Promise<unknown> = Promise.resolve();

  runInTransaction<T>(work: (tx: TicketTransactionPort) => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const draft = structuredClone({ tickets: this.tickets, counters: this.counters });
      const result = await work(this.txOver(draft));
      this.tickets = draft.tickets;
      this.counters = draft.counters;
      this.commits++;
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async findByIdempotencyKey(actorId: string, key: string): Promise<TicketRecord | null> {
    return this.tickets.find((t) => t.emitidoPorId === actorId && t.idempotencyKey === key) ?? null;
  }

  async findById(id: string): Promise<TicketRecord | null> {
    return this.tickets.find((t) => t.id === id) ?? null;
  }

  async list(): Promise<Paginated<TicketRecord>> {
    return paginate(this.tickets, this.tickets.length, 1, 10);
  }

  async listActive(): Promise<TicketRecord[]> {
    return this.tickets.filter((t) => ESTADOS_ACTIVOS.includes(t.estadoTurno));
  }

  private txOver(draft: {
    tickets: TicketRecord[];
    counters: Map<string, number>;
  }): TicketTransactionPort {
    const repo = this;
    return {
      lockTurnos: async () => undefined,
      findByIdempotencyKey: async (actorId, key) =>
        draft.tickets.find((t) => t.emitidoPorId === actorId && t.idempotencyKey === key) ?? null,
      findById: async (id) => draft.tickets.find((t) => t.id === id) ?? null,
      findCliente: async (id) => repo.clientes.get(id) ?? null,
      findVehiculo: async (id) => repo.vehiculos.get(id) ?? null,
      findServicio: async (id) => repo.servicios.get(id) ?? null,
      vehicleHasActiveTurn: async (vehiculoId) =>
        draft.tickets.some(
          (t) => t.vehiculoId === vehiculoId && ESTADOS_ACTIVOS.includes(t.estadoTurno),
        ),
      nextSequence: async (fecha) => {
        const next = (draft.counters.get(fecha) ?? 0) + 1;
        draft.counters.set(fecha, next);
        return next;
      },
      createTicket: async (data: NewTicketData) => {
        if (
          draft.tickets.some(
            (t) => t.emitidoPorId === data.emitidoPorId && t.idempotencyKey === data.idempotencyKey,
          )
        ) {
          throw new DuplicateIdempotencyKeyError();
        }
        const id = `ticket-${draft.tickets.length + 1}`;
        draft.tickets.push({
          ...data,
          id,
          estadoTurno: 'EN_ESPERA',
          numeroEstacion: null,
          lavadorId: null,
          lavadorNombre: null,
          fechaInicioLavado: null,
          fechaFinalizacion: null,
          fechaEntrega: null,
          historial: [{ estado: 'EN_ESPERA', fecha: data.emitidoEn, usuarioId: data.emitidoPorId }],
        });
        if (repo.failAfterCreate) throw new Error('fallo simulado antes del commit');
        return id;
      },
      occupiedStations: async () =>
        draft.tickets
          .filter((t) => ESTADOS_EN_ESTACION.includes(t.estadoTurno) && t.numeroEstacion)
          .map((t) => t.numeroEstacion as NumeroEstacion),
      pendingFifo: async (limit) =>
        draft.tickets
          .filter((t) => t.estadoTurno === 'EN_ESPERA')
          .sort(
            (a, b) =>
              a.emitidoEn.getTime() - b.emitidoEn.getTime() ||
              a.numeroTurno.localeCompare(b.numeroTurno),
          )
          .slice(0, limit)
          .map((t) => t.id),
      updateTurno: async (id, changes, historial) => {
        const t = draft.tickets.find((x) => x.id === id)!;
        Object.assign(t, changes);
        t.historial.push(historial);
      },
    };
  }
}

function usuario(id: string, rol: UsuarioRecord['rol'], activo = true): UsuarioRecord {
  return {
    id,
    usuario: id,
    nombreVisible: id,
    rol,
    activo,
    codigo: null,
    ubicacion: null,
    estacionPreferida: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function setup() {
  const repo = new InMemoryTicketRepository();
  repo.clientes.set(CLIENTE, {
    id: CLIENTE,
    activo: true,
    tipoDocumento: 'CEDULA',
    numeroDocumento: '1710034065',
    nombres: 'Roberto Carlos',
    apellidos: 'Andrade',
    razonSocial: null,
  });
  repo.clientes.set(OTRO_CLIENTE, { ...repo.clientes.get(CLIENTE)!, id: OTRO_CLIENTE });
  repo.vehiculos.set(VEHICULO, {
    id: VEHICULO,
    clienteId: CLIENTE,
    activo: true,
    placa: 'PBH4321',
    marca: 'Chevrolet',
    modelo: 'Sail',
    color: 'Plata',
    tipoVehiculo: 'AUTOMOVIL',
  });
  repo.vehiculos.set(VEHICULO_2, {
    ...repo.vehiculos.get(VEHICULO)!,
    id: VEHICULO_2,
    placa: 'PCX8920',
  });
  repo.servicios.set(SERVICIO, {
    id: SERVICIO,
    activo: true,
    nombre: 'Lavado completo',
    precio: '10.00',
    moneda: 'USD',
  });
  repo.servicios.set(SERVICIO_INACTIVO, {
    ...repo.servicios.get(SERVICIO)!,
    id: SERVICIO_INACTIVO,
    activo: false,
  });

  const users = new Map<string, UsuarioRecord>([
    [MAQUINA_1, usuario(MAQUINA_1, 'MAQUINA')],
    [MAQUINA_2, usuario(MAQUINA_2, 'MAQUINA')],
    [ADMIN, usuario(ADMIN, 'ADMIN')],
  ]);
  const usuarios = {
    findById: jest.fn((id: string) => Promise.resolve(users.get(id) ?? null)),
  } as unknown as UsuarioRepositoryPort;

  // Registra el número de commits observado en el momento de notificar.
  const commitsAtNotify: number[] = [];
  const notifier: jest.Mocked<TicketEmissionNotifierPort> = {
    notifyTicketEmitido: jest.fn((_machineId: string, _event: TicketEmitidoEvent) => {
      commitsAtNotify.push(repo.commits);
    }),
  };

  const useCase = new EmitirTicketUseCase(repo, usuarios, notifier, new TurnoDispatcherService());
  return { repo, users, notifier, commitsAtNotify, useCase };
}

const maquina1: AuthenticatedUser = { id: MAQUINA_1, usuario: 'kiosk01', rol: 'MAQUINA' };
const admin: AuthenticatedUser = { id: ADMIN, usuario: 'admin', rol: 'ADMIN' };
const body = { clienteId: CLIENTE, vehiculoId: VEHICULO, servicioLavadoId: SERVICIO };

describe('EmitirTicketUseCase', () => {
  it('emisión válida persiste un ticket con precio del servidor y notifica después del commit', async () => {
    const { repo, notifier, commitsAtNotify, useCase } = setup();

    const result = await useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body });

    expect(result.replayed).toBe(false);
    expect(repo.tickets).toHaveLength(1);
    expect(result.ticket).toMatchObject({
      precio: '10.00',
      moneda: 'USD',
      machineId: MAQUINA_1,
      clienteNombre: 'Roberto Carlos Andrade',
      vehiculoPlaca: 'PBH4321',
    });
    expect(result.ticket.numeroTurno).toMatch(/^CW-\d{8}-0001$/);
    // Estaciones libres: el despachador lo asigna de inmediato.
    expect(result.ticket).toMatchObject({ estadoTurno: 'LAVANDO', numeroEstacion: 1 });

    expect(notifier.notifyTicketEmitido).toHaveBeenCalledTimes(1);
    expect(commitsAtNotify).toEqual([1]);
    const [room, event] = notifier.notifyTicketEmitido.mock.calls[0];
    expect(room).toBe(MAQUINA_1);
    expect(event.requestId).toBe(KEY);
    expect(event.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(event.occurredAt).toISOString()).toBe(event.occurredAt);
    expect(event.ticket).toMatchObject({
      ticketId: result.ticket.id,
      estado: 'EMITIDO',
      estadoPago: 'PENDIENTE',
      servicio: { id: SERVICIO, nombre: 'Lavado completo', precio: '10.00', moneda: 'USD' },
      vehiculo: { id: VEHICULO, placa: 'PBH4321' },
    });
  });

  it('reintento con misma clave y body devuelve el ticket existente sin nuevo evento', async () => {
    const { repo, notifier, useCase } = setup();
    const first = await useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body });
    const second = await useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body });

    expect(second.replayed).toBe(true);
    expect(second.ticket.id).toBe(first.ticket.id);
    expect(repo.tickets).toHaveLength(1);
    expect(notifier.notifyTicketEmitido).toHaveBeenCalledTimes(1);
  });

  it('misma clave con body distinto → 409 IDEMPOTENCY_KEY_REUSED', async () => {
    const { useCase } = setup();
    await useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body });
    await expect(
      useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body, vehiculoId: VEHICULO_2 }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED', status: 409 });
  });

  it('peticiones concurrentes con la misma clave generan un solo ticket', async () => {
    const { repo, notifier, useCase } = setup();
    const results = await Promise.all([
      useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body }),
      useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body }),
    ]);
    expect(repo.tickets).toHaveLength(1);
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    expect(notifier.notifyTicketEmitido).toHaveBeenCalledTimes(1);
  });

  it('claves distintas no repiten número de turno', async () => {
    const { repo, useCase } = setup();
    await useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body });
    await useCase.execute({
      actor: maquina1,
      idempotencyKey: '50000000-0000-4000-8000-000000000002',
      ...body,
      vehiculoId: VEHICULO_2,
    });
    const numeros = repo.tickets.map((t) => t.numeroTurno);
    expect(new Set(numeros).size).toBe(2);
  });

  it('rollback: un fallo dentro de la transacción no persiste ni emite', async () => {
    const { repo, notifier, useCase } = setup();
    repo.failAfterCreate = true;
    await expect(
      useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body }),
    ).rejects.toThrow();
    expect(repo.tickets).toHaveLength(0);
    expect(notifier.notifyTicketEmitido).not.toHaveBeenCalled();
  });

  it.each([
    [
      'cliente inexistente',
      { clienteId: '20000000-0000-4000-8000-000000000099' },
      'CLIENTE_NO_ENCONTRADO',
    ],
    ['vehículo de otro cliente', { clienteId: OTRO_CLIENTE }, 'VEHICULO_NO_PERTENECE_AL_CLIENTE'],
    ['servicio inactivo', { servicioLavadoId: SERVICIO_INACTIVO }, 'SERVICIO_INACTIVO'],
  ])('validación fallida (%s) no emite eventos', async (_label, override, code) => {
    const { notifier, useCase, repo } = setup();
    await expect(
      useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body, ...override }),
    ).rejects.toMatchObject({ code });
    expect(repo.tickets).toHaveLength(0);
    expect(notifier.notifyTicketEmitido).not.toHaveBeenCalled();
  });

  it('vehículo con turno activo → 409', async () => {
    const { useCase } = setup();
    await useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body });
    await expect(
      useCase.execute({
        actor: maquina1,
        idempotencyKey: '50000000-0000-4000-8000-000000000003',
        ...body,
      }),
    ).rejects.toMatchObject({ code: 'VEHICULO_CON_TURNO_ACTIVO' });
  });

  it('fallo del notifier no impide la respuesta exitosa y el reintento recupera el ticket', async () => {
    const { notifier, useCase } = setup();
    notifier.notifyTicketEmitido.mockImplementation(() => {
      throw new Error('socket caído');
    });
    const result = await useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body });
    expect(result.replayed).toBe(false);
    const retry = await useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body });
    expect(retry.ticket.id).toBe(result.ticket.id);
  });

  it('una máquina no puede emitir hacia otra máquina', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body, machineId: MAQUINA_2 }),
    ).rejects.toMatchObject({ code: 'MACHINE_NOT_AUTHORIZED', status: 403 });
  });

  it('máquina desactivada no puede emitir', async () => {
    const { users, useCase } = setup();
    users.set(MAQUINA_1, usuario(MAQUINA_1, 'MAQUINA', false));
    await expect(
      useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('administrador debe indicar una máquina destino válida y el evento va a esa room', async () => {
    const { notifier, useCase } = setup();
    await expect(
      useCase.execute({ actor: admin, idempotencyKey: KEY, ...body }),
    ).rejects.toMatchObject({
      code: 'MACHINE_ID_REQUIRED',
    });
    await expect(
      useCase.execute({ actor: admin, idempotencyKey: KEY, ...body, machineId: ADMIN }),
    ).rejects.toMatchObject({ code: 'MACHINE_NOT_AUTHORIZED' });

    const result = await useCase.execute({
      actor: admin,
      idempotencyKey: KEY,
      ...body,
      machineId: MAQUINA_2,
    });
    expect(result.ticket.machineId).toBe(MAQUINA_2);
    expect(notifier.notifyTicketEmitido).toHaveBeenCalledWith(MAQUINA_2, expect.anything());
  });

  it('con ambas estaciones ocupadas el ticket queda EN_ESPERA', async () => {
    const { repo, useCase } = setup();
    const ocupado = (await useCase.execute({ actor: maquina1, idempotencyKey: KEY, ...body }))
      .ticket;
    // Segunda estación ocupada por otro vehículo.
    repo.tickets.push({
      ...ocupado,
      id: 'ocupa-2',
      vehiculoId: 'otro',
      numeroEstacion: 2,
      idempotencyKey: 'x',
    });

    const result = await useCase.execute({
      actor: maquina1,
      idempotencyKey: '50000000-0000-4000-8000-000000000200',
      ...body,
      vehiculoId: VEHICULO_2,
    });
    expect(result.ticket).toMatchObject({ estadoTurno: 'EN_ESPERA', numeroEstacion: null });
  });
});
