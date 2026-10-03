import { JwtService } from '@nestjs/jwt';
import { TokenVerifierService } from '../../../auth/application/services/token-verifier.service';
import type { UsuarioRepositoryPort } from '../../../usuarios/domain/interfaces/usuario-repository.port';
import { UsuarioRecord } from '../../../usuarios/domain/types/usuario.types';
import { ChannelAuthError, EmissionChannelAuthService } from './emission-channel-auth.service';

const SECRET = 'secreto-de-pruebas-con-mas-de-32-caracteres';
const jwt = new JwtService({ secret: SECRET });

const MAQUINA = '10000000-0000-4000-8000-000000000001';
const OTRA_MAQUINA = '10000000-0000-4000-8000-000000000002';
const ADMIN = '10000000-0000-4000-8000-0000000000aa';
const LAVADOR = '10000000-0000-4000-8000-0000000000bb';

function user(id: string, rol: UsuarioRecord['rol'], activo = true): UsuarioRecord {
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
  const users = new Map<string, UsuarioRecord>([
    [MAQUINA, user(MAQUINA, 'MAQUINA')],
    [OTRA_MAQUINA, user(OTRA_MAQUINA, 'MAQUINA')],
    [ADMIN, user(ADMIN, 'ADMIN')],
    [LAVADOR, user(LAVADOR, 'LAVADOR')],
  ]);
  const repo = {
    findById: (id: string) => Promise.resolve(users.get(id) ?? null),
  } as UsuarioRepositoryPort;
  return { users, service: new EmissionChannelAuthService(new TokenVerifierService(jwt), repo) };
}

const token = (sub: string, rol: string, typ = 'access', expiresIn = 3600) =>
  jwt.sign({ sub, usuario: sub, rol, typ }, { expiresIn });

async function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ChannelAuthError);
  expect((error as ChannelAuthError).code).toBe(code);
}

describe('EmissionChannelAuthService (handshake /tickets-emision)', () => {
  it('máquina activa se une a su propia room aunque envíe otro machineId', async () => {
    const { service } = setup();
    const identity = await service.authenticate(token(MAQUINA, 'MAQUINA'), OTRA_MAQUINA);
    expect(identity.machineId).toBe(MAQUINA);
    expect(identity.expiresAt).toBeGreaterThan(Date.now());
  });

  it('rechaza refresh tokens', async () => {
    const { service } = setup();
    await expectCode(
      service.authenticate(token(MAQUINA, 'MAQUINA', 'refresh'), undefined),
      'UNAUTHORIZED',
    );
  });

  it('rechaza tokens expirados, con firma inválida o ausentes', async () => {
    const { service } = setup();
    await expectCode(
      service.authenticate(token(MAQUINA, 'MAQUINA', 'access', -10), undefined),
      'UNAUTHORIZED',
    );
    const forged = new JwtService({ secret: 'otro-secreto-de-mas-de-32-caracteres!!' }).sign({
      sub: MAQUINA,
      rol: 'MAQUINA',
      typ: 'access',
    });
    await expectCode(service.authenticate(forged, undefined), 'UNAUTHORIZED');
    await expectCode(service.authenticate(undefined, undefined), 'UNAUTHORIZED');
  });

  it('rechaza usuarios desactivados aunque el token siga vigente', async () => {
    const { service, users } = setup();
    users.set(MAQUINA, user(MAQUINA, 'MAQUINA', false));
    await expectCode(service.authenticate(token(MAQUINA, 'MAQUINA'), undefined), 'UNAUTHORIZED');
  });

  it('lavadores no tienen acceso al canal', async () => {
    const { service } = setup();
    await expectCode(service.authenticate(token(LAVADOR, 'LAVADOR'), undefined), 'FORBIDDEN');
  });

  it('administrador debe seleccionar una máquina activa', async () => {
    const { service, users } = setup();
    await expectCode(
      service.authenticate(token(ADMIN, 'ADMIN'), undefined),
      'MACHINE_NOT_AUTHORIZED',
    );
    await expectCode(
      service.authenticate(token(ADMIN, 'ADMIN'), LAVADOR),
      'MACHINE_NOT_AUTHORIZED',
    );
    users.set(OTRA_MAQUINA, user(OTRA_MAQUINA, 'MAQUINA', false));
    await expectCode(
      service.authenticate(token(ADMIN, 'ADMIN'), OTRA_MAQUINA),
      'MACHINE_NOT_AUTHORIZED',
    );

    const identity = await service.authenticate(token(ADMIN, 'ADMIN'), MAQUINA);
    expect(identity).toMatchObject({ userId: ADMIN, machineId: MAQUINA });
  });
});
