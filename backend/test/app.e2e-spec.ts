import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/context/database/prisma.service';
import { setupApp } from '../src/setup-app';

const ORIGIN = (process.env.FRONTEND_URL ?? '').split(',')[0].trim();
const PASSWORD = 'clave-de-prueba-123';

interface Fixtures {
  kiosk01: string;
  kiosk02: string;
  clienteId: string;
  otroClienteId: string;
  vehiculos: string[];
  servicioId: string;
  servicioInactivoId: string;
}

describe('Car Wash API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  let fx: Fixtures;
  const sockets: Socket[] = [];

  const http = () => request(app.getHttpServer());

  async function login(usuario: string): Promise<{ token: string; cookie: string }> {
    const res = await http()
      .post('/api/auth/login')
      .send({ usuario, password: PASSWORD })
      .expect(200);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    return { token: res.body.data.accessToken as string, cookie: setCookie[0].split(';')[0] };
  }

  function connect(token: string, opts: { origin?: string; machineId?: string } = {}): Socket {
    const socket = io(`${baseUrl}/tickets-emision`, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token, ...(opts.machineId ? { machineId: opts.machineId } : {}) },
      extraHeaders: { origin: opts.origin ?? ORIGIN },
      reconnection: false,
      forceNew: true,
    });
    sockets.push(socket);
    return socket;
  }

  const waitReady = (socket: Socket) =>
    new Promise<unknown>((resolve, reject) => {
      socket.once('emision:ready', resolve);
      socket.once('connect_error', reject);
    });

  const waitConnectError = (socket: Socket) =>
    new Promise<Error & { data?: { code?: string } }>((resolve, reject) => {
      socket.once('connect_error', resolve);
      socket.once('emision:ready', () => reject(new Error('se esperaba rechazo')));
    });

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  function emitir(token: string, key: string, body: Record<string, unknown>) {
    return http()
      .post('/api/tickets/emision')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send(body);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({
      bodyParser: false,
      logger: false,
    });
    setupApp(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
    prisma = app.get(PrismaService);

    await prisma.$executeRawUnsafe(
      'TRUNCATE ticket_historial_estados, tickets, turno_counters, vehicle_lookup_snapshots, vehiculos, clientes, servicios_lavado, usuarios CASCADE',
    );
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    const mk = (usuario: string, rol: 'ADMIN' | 'MAQUINA' | 'LAVADOR') =>
      prisma.usuario.create({ data: { usuario, nombreVisible: usuario, rol, passwordHash } });
    await mk('admin', 'ADMIN');
    const k1 = await mk('kiosk01', 'MAQUINA');
    const k2 = await mk('kiosk02', 'MAQUINA');
    await mk('carlos', 'LAVADOR');

    const cliente = await prisma.cliente.create({
      data: {
        tipoDocumento: 'CEDULA',
        numeroDocumento: '1710034065',
        nombres: 'Roberto',
        apellidos: 'Andrade',
        telefono: '0998765432',
      },
    });
    const otro = await prisma.cliente.create({
      data: {
        tipoDocumento: 'PASAPORTE',
        numeroDocumento: 'A9823412B',
        nombres: 'Ana',
        apellidos: 'Ruiz',
        telefono: '0991111111',
      },
    });
    const vehiculos: string[] = [];
    for (let i = 0; i < 8; i++) {
      const v = await prisma.vehiculo.create({
        data: {
          clienteId: cliente.id,
          placa: `PBH${4320 + i}`,
          tipoVehiculo: 'AUTOMOVIL',
          marca: 'Chevrolet',
          modelo: 'Sail',
          color: 'Plata',
        },
      });
      vehiculos.push(v.id);
    }
    const servicio = await prisma.servicioLavado.create({
      data: {
        codigo: 'LAVADO_COMPLETO',
        nombre: 'Lavado completo',
        descripcion: 'x',
        precio: '10.00',
      },
    });
    const inactivo = await prisma.servicioLavado.create({
      data: {
        codigo: 'LAVADO_SIMPLE',
        nombre: 'Inactivo',
        descripcion: 'x',
        precio: '5.00',
        activo: false,
      },
    });
    fx = {
      kiosk01: k1.id,
      kiosk02: k2.id,
      clienteId: cliente.id,
      otroClienteId: otro.id,
      vehiculos,
      servicioId: servicio.id,
      servicioInactivoId: inactivo.id,
    };
  });

  afterAll(async () => {
    sockets.forEach((s) => s.close());
    await app?.close();
  });

  describe('auth', () => {
    it('login, refresh con rotación y Origin, logout', async () => {
      const { token, cookie } = await login('kiosk01');
      expect(token).toBeTruthy();

      await http().post('/api/auth/refresh').set('Cookie', cookie).expect(403); // sin Origin
      const refreshed = await http()
        .post('/api/auth/refresh')
        .set('Cookie', cookie)
        .set('Origin', ORIGIN)
        .expect(200);
      expect(refreshed.body.data.accessToken).toBeTruthy();
      expect(refreshed.headers['set-cookie']).toBeDefined();

      await http().post('/api/auth/logout').set('Origin', ORIGIN).expect(204);
    });

    it('credenciales inválidas y formato de error estable', async () => {
      const res = await http()
        .post('/api/auth/login')
        .send({ usuario: 'kiosk01', password: 'mala' })
        .expect(401);
      expect(res.body).toEqual({
        error: { code: 'INVALID_CREDENTIALS', message: expect.any(String), details: [] },
      });
    });

    it('el refresh token no sirve como Bearer', async () => {
      const { cookie } = await login('kiosk01');
      const refreshToken = cookie.split('=')[1];
      await http().get('/api/auth/me').set('Authorization', `Bearer ${refreshToken}`).expect(401);
    });

    it('rutas protegidas por defecto y por rol', async () => {
      await http().get('/api/servicios').expect(401);
      const { token } = await login('kiosk01');
      await http().get('/api/usuarios').set('Authorization', `Bearer ${token}`).expect(403);
      await http().get('/api/health').expect(200);
    });
  });

  describe('emisión de tickets + Socket.IO', () => {
    let k1: { token: string };
    let k2: { token: string };

    beforeAll(async () => {
      k1 = await login('kiosk01');
      k2 = await login('kiosk02');
    });

    it('emite, notifica solo a la room de su máquina y el reintento no reemite', async () => {
      const s1 = connect(k1.token);
      const s2 = connect(k2.token);
      await Promise.all([waitReady(s1), waitReady(s2)]);

      const recibidos1: any[] = [];
      const recibidos2: any[] = [];
      s1.on('ticket:emitido', (e) => recibidos1.push(e));
      s2.on('ticket:emitido', (e) => recibidos2.push(e));

      const key = randomUUID();
      const body = {
        clienteId: fx.clienteId,
        vehiculoId: fx.vehiculos[0],
        servicioLavadoId: fx.servicioId,
      };
      const res = await emitir(k1.token, key, body).expect(201);

      expect(res.body.meta).toEqual({ requestId: key, replayed: false });
      expect(res.body.data).toMatchObject({
        numeroTurno: expect.stringMatching(/^CW-\d{8}-\d{4}$/),
        estado: 'EMITIDO',
        servicio: { id: fx.servicioId, precio: '10.00', moneda: 'USD' },
      });

      await sleep(300);
      expect(recibidos1).toHaveLength(1);
      expect(recibidos1[0]).toMatchObject({
        requestId: key,
        eventId: expect.any(String),
        occurredAt: expect.any(String),
      });
      expect(recibidos1[0].ticket).toEqual(res.body.data);
      expect(recibidos2).toHaveLength(0);

      const replay = await emitir(k1.token, key, body).expect(200);
      expect(replay.body.meta.replayed).toBe(true);
      expect(replay.body.data.ticketId).toBe(res.body.data.ticketId);
      await sleep(300);
      expect(recibidos1).toHaveLength(1);

      await emitir(k1.token, key, { ...body, vehiculoId: fx.vehiculos[1] }).expect(409);
    });

    it('peticiones concurrentes con la misma clave crean un solo ticket', async () => {
      const key = randomUUID();
      const body = {
        clienteId: fx.clienteId,
        vehiculoId: fx.vehiculos[2],
        servicioLavadoId: fx.servicioId,
      };
      const results = await Promise.all(
        Array.from({ length: 5 }, () => emitir(k1.token, key, body)),
      );
      expect(results.map((r) => r.status).sort()).toEqual([200, 200, 200, 200, 201]);
      expect(await prisma.ticket.count({ where: { idempotencyKey: key } })).toBe(1);
    });

    it('emisiones concurrentes con claves distintas no repiten número de turno', async () => {
      const results = await Promise.all(
        [3, 4, 5].map((i) =>
          emitir(k1.token, randomUUID(), {
            clienteId: fx.clienteId,
            vehiculoId: fx.vehiculos[i],
            servicioLavadoId: fx.servicioId,
          }),
        ),
      );
      results.forEach((r) => expect(r.status).toBe(201));
      const numeros = results.map((r) => r.body.data.numeroTurno as string);
      expect(new Set(numeros).size).toBe(3);
    });

    it('validaciones fallidas no emiten eventos', async () => {
      const s1 = connect(k1.token);
      await waitReady(s1);
      const recibidos: unknown[] = [];
      s1.on('ticket:emitido', (e) => recibidos.push(e));

      await emitir(k1.token, randomUUID(), {
        clienteId: fx.otroClienteId,
        vehiculoId: fx.vehiculos[6],
        servicioLavadoId: fx.servicioId,
      }).expect(409);
      await emitir(k1.token, randomUUID(), {
        clienteId: fx.clienteId,
        vehiculoId: fx.vehiculos[6],
        servicioLavadoId: fx.servicioInactivoId,
      }).expect(409);
      await emitir(k1.token, 'no-es-uuid', {
        clienteId: fx.clienteId,
        vehiculoId: fx.vehiculos[6],
        servicioLavadoId: fx.servicioId,
      }).expect(400);
      await http()
        .post('/api/tickets/emision')
        .set('Authorization', `Bearer ${k1.token}`)
        .set('Idempotency-Key', randomUUID())
        .send({
          clienteId: fx.clienteId,
          vehiculoId: fx.vehiculos[6],
          servicioLavadoId: fx.servicioId,
          precio: 1,
        })
        .expect(400);

      await sleep(300);
      expect(recibidos).toHaveLength(0);
    });

    it('el handshake rechaza refresh tokens, orígenes no permitidos y lavadores', async () => {
      const { cookie } = await login('kiosk01');
      const refresh = connect(cookie.split('=')[1]);
      expect((await waitConnectError(refresh)).message).toBe('UNAUTHORIZED');

      const badOrigin = connect(k1.token, { origin: 'https://evil.example' });
      await waitConnectError(badOrigin);

      const lavador = await login('carlos');
      const lav = connect(lavador.token);
      expect((await waitConnectError(lav)).message).toBe('FORBIDDEN');

      const admin = await login('admin');
      const sinMaquina = connect(admin.token);
      expect((await waitConnectError(sinMaquina)).message).toBe('MACHINE_NOT_AUTHORIZED');
      const conMaquina = connect(admin.token, { machineId: fx.kiosk02 });
      await expect(waitReady(conMaquina)).resolves.toEqual({ machineId: fx.kiosk02 });
    });
  });

  describe('turnos (REST, sin eventos)', () => {
    it('avanza un turno hasta LISTO y lo entrega', async () => {
      const admin = await login('admin');
      const auth = { Authorization: `Bearer ${admin.token}` };
      const s1 = connect((await login('kiosk01')).token);
      await waitReady(s1);
      const recibidos: unknown[] = [];
      s1.on('ticket:emitido', (e) => recibidos.push(e));

      const { body: activos } = await http().get('/api/turnos/activos').set(auth).expect(200);
      const lavando = (activos.data as Array<{ id: string; estadoTurno: string }>).find(
        (t) => t.estadoTurno === 'LAVANDO',
      )!;
      await http().post(`/api/turnos/${lavando.id}/avanzar`).set(auth).expect(200);
      const listo = await http().post(`/api/turnos/${lavando.id}/avanzar`).set(auth).expect(200);
      expect(listo.body.data).toMatchObject({ estadoTurno: 'LISTO', numeroEstacion: null });
      await http().post(`/api/turnos/${lavando.id}/avanzar`).set(auth).expect(409);
      const entregado = await http()
        .post(`/api/turnos/${lavando.id}/entregar`)
        .set(auth)
        .expect(200);
      expect(entregado.body.data.estadoTurno).toBe('ENTREGADO');

      await sleep(300);
      expect(recibidos).toHaveLength(0);
    });
  });

  describe('consulta de placa (botón Validar)', () => {
    it('hallazgo local, placa inválida y proveedor deshabilitado', async () => {
      const { token } = await login('kiosk01');
      const auth = { Authorization: `Bearer ${token}` };

      const local = await http()
        .get('/api/vehicles/lookup?licensePlate=pbh-4327')
        .set(auth)
        .expect(200);
      expect(local.body.meta.source).toBe('LOCAL');
      expect(local.body.data).toMatchObject({
        licensePlate: 'PBH4327',
        brand: 'Chevrolet',
        vehicleId: fx.vehiculos[7],
      });

      const invalid = await http()
        .get('/api/vehicles/lookup?licensePlate=PB%3C1')
        .set(auth)
        .expect(400);
      expect(invalid.body.error.code).toBe('INVALID_LICENSE_PLATE');

      const unavailable = await http()
        .get('/api/vehicles/lookup?licensePlate=ZZZ9999')
        .set(auth)
        .expect(503);
      expect(unavailable.body.error.code).toBe('VEHICLE_PROVIDER_UNAVAILABLE');
      expect(await prisma.vehiculo.count({ where: { placa: 'ZZZ9999' } })).toBe(0);
    });

    it('registro de vehículo: placa de otro cliente → 409', async () => {
      const { token } = await login('kiosk01');
      const res = await http()
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clienteId: fx.otroClienteId,
          placa: 'PBH-4320',
          tipoVehiculo: 'AUTOMOVIL',
          marca: 'X',
          modelo: 'Y',
          color: 'Z',
        })
        .expect(409);
      expect(res.body.error.code).toBe('PLACA_REGISTRADA_OTRO_CLIENTE');

      const nuevo = await http()
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clienteId: fx.otroClienteId,
          placa: 'ia-7000',
          tipoVehiculo: 'CAMIONETA',
          marca: 'Hino',
          modelo: '300',
          color: 'Blanco',
        })
        .expect(201);
      expect(nuevo.body.data).toMatchObject({ placa: 'IA7000', dataSource: 'MANUAL' });
    });
  });
});
