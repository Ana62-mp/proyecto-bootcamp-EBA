/**
 * Seed idempotente: usuarios de prueba, servicios de lavado y clientes/vehículos de demostración
 * equivalentes a frontend/src/data/seedData.ts. Las contraseñas son de prueba: no usar en producción.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PrismaClient,
  Rol,
  TipoDocumento,
  TipoLavado,
  TipoVehiculo,
} from '../src/generated/prisma/client';

if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
  console.error('Seed bloqueado en producción (usuarios con contraseñas de prueba).');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const USUARIOS: Array<{
  usuario: string;
  nombreVisible: string;
  rol: Rol;
  password: string;
  codigo?: string;
  ubicacion?: string;
  estacionPreferida?: number;
}> = [
  {
    usuario: 'admin',
    nombreVisible: 'Administrador Principal',
    rol: 'ADMIN',
    password: 'admin123',
  },
  {
    usuario: 'kiosk01',
    nombreVisible: 'Kiosko Autoservicio 01',
    rol: 'MAQUINA',
    password: 'kiosk123',
    codigo: 'KIOSK-01',
    ubicacion: 'Entrada Norte - Carril 1',
  },
  {
    usuario: 'kiosk02',
    nombreVisible: 'Kiosko Autoservicio 02',
    rol: 'MAQUINA',
    password: 'kiosk123',
    codigo: 'KIOSK-02',
    ubicacion: 'Entrada Sur - Carril 2',
  },
  {
    usuario: 'carlos',
    nombreVisible: 'Carlos Mendoza',
    rol: 'LAVADOR',
    password: 'lavador123',
    codigo: 'LAV-01',
    estacionPreferida: 1,
  },
  {
    usuario: 'miguel',
    nombreVisible: 'Miguel Ángel Torres',
    rol: 'LAVADOR',
    password: 'lavador123',
    codigo: 'LAV-02',
    estacionPreferida: 2,
  },
];

const SERVICIOS: Array<{
  codigo: TipoLavado;
  nombre: string;
  descripcion: string;
  precio: string;
  activo: boolean;
}> = [
  {
    codigo: 'LAVADO_SIMPLE',
    nombre: 'Lavado simple',
    descripcion: 'Lavado exterior a presión, shampoo biodegradable y secado rápido.',
    precio: '5.00',
    activo: true,
  },
  {
    codigo: 'LAVADO_COMPLETO',
    nombre: 'Lavado completo',
    descripcion: 'Lavado exterior profundo, aspirado interior de cabina y abrillantado de llantas.',
    precio: '10.00',
    activo: true,
  },
  {
    codigo: 'LAVADO_TAPICERIA',
    nombre: 'Lavado + tapicería',
    descripcion:
      'Lavado integral más extracción profunda de manchas en asientos, alfombras y techo.',
    precio: '25.00',
    activo: true,
  },
  {
    codigo: 'PARAFINADO',
    nombre: 'Parafinado',
    descripcion:
      'Tratamiento anticorrosivo de chasis y carrocería con cera parafínica de alta durabilidad.',
    precio: '20.00',
    activo: true,
  },
  {
    codigo: 'LAVADO_SIMPLE',
    nombre: 'Lavado de motor a vapor (Temporalmente inactivo)',
    descripcion: 'Desengrasado y limpieza con vapor seco de componentes mecánicos.',
    precio: '15.00',
    activo: false,
  },
];

interface ClienteSeed {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string | null;
  apellidos: string | null;
  razonSocial: string | null;
  nombreContacto: string | null;
  telefono: string;
  correo: string | null;
  activo: boolean;
  vehiculos: Array<{
    placa: string;
    marca: string;
    modelo: string;
    color: string;
    tipoVehiculo: TipoVehiculo;
    activo: boolean;
  }>;
}

async function seedUsuarios(): Promise<void> {
  for (const { password, ...u } of USUARIOS) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.usuario.upsert({
      where: { usuario: u.usuario },
      create: { ...u, passwordHash },
      update: { ...u, passwordHash, activo: true },
    });
  }
}

async function seedServicios(): Promise<void> {
  for (const s of SERVICIOS) {
    const existing = await prisma.servicioLavado.findFirst({ where: { nombre: s.nombre } });
    if (existing) await prisma.servicioLavado.update({ where: { id: existing.id }, data: s });
    else await prisma.servicioLavado.create({ data: s });
  }
}

async function seedClientes(): Promise<void> {
  const clientes = JSON.parse(
    readFileSync(join(__dirname, 'seed-data', 'clientes.json'), 'utf8'),
  ) as ClienteSeed[];

  for (const { vehiculos, ...c } of clientes) {
    const cliente = await prisma.cliente.upsert({
      where: {
        tipoDocumento_numeroDocumento: {
          tipoDocumento: c.tipoDocumento,
          numeroDocumento: c.numeroDocumento,
        },
      },
      create: c,
      update: c,
    });
    for (const v of vehiculos) {
      await prisma.vehiculo.upsert({
        where: { placa: v.placa },
        create: { ...v, clienteId: cliente.id },
        update: { ...v, clienteId: cliente.id },
      });
    }
  }
}

async function main(): Promise<void> {
  await seedUsuarios();
  await seedServicios();
  await seedClientes();
  console.log('Seed completado: usuarios, servicios y clientes de demostración.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed fallido:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
