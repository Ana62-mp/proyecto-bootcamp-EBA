-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'MAQUINA', 'LAVADOR');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CEDULA', 'PASAPORTE', 'RUC');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('AUTOMOVIL', 'SUV', 'CAMIONETA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoLavado" AS ENUM ('LAVADO_SIMPLE', 'LAVADO_COMPLETO', 'LAVADO_TAPICERIA', 'PARAFINADO');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('EN_ESPERA', 'LAVANDO', 'SECANDO_PULIENDO', 'LISTO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "VehicleDataSource" AS ENUM ('MANUAL', 'WEBSERVICES_EC');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "usuario" TEXT NOT NULL,
    "nombre_visible" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "codigo" TEXT,
    "ubicacion" TEXT,
    "estacion_preferida" INTEGER,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "nombres" TEXT,
    "apellidos" TEXT,
    "razon_social" TEXT,
    "nombre_contacto" TEXT,
    "telefono" TEXT NOT NULL,
    "correo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo_vehiculo" "TipoVehiculo" NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "provider_vehicle_id" INTEGER,
    "vehicle_class" TEXT,
    "year" INTEGER,
    "country" TEXT,
    "service_type" TEXT,
    "registration_date" DATE,
    "registration_expiry_date" DATE,
    "provider_auto_year" INTEGER,
    "chassis" TEXT,
    "engine_number" TEXT,
    "data_source" "VehicleDataSource" NOT NULL DEFAULT 'MANUAL',
    "provider_queried_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_lookup_snapshots" (
    "placa" TEXT NOT NULL,
    "provider_vehicle_id" INTEGER,
    "vehicle_class" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "country" TEXT,
    "color" TEXT,
    "service_type" TEXT,
    "registration_date" DATE,
    "registration_expiry_date" DATE,
    "provider_auto_year" INTEGER,
    "chassis" TEXT,
    "engine_number" TEXT,
    "queried_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_lookup_snapshots_pkey" PRIMARY KEY ("placa")
);

-- CreateTable
CREATE TABLE "servicios_lavado" (
    "id" UUID NOT NULL,
    "codigo" "TipoLavado" NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'USD',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_lavado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "numero_turno" TEXT NOT NULL,
    "fecha_turno" DATE NOT NULL,
    "secuencia" INTEGER NOT NULL,
    "emitido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cliente_id" UUID NOT NULL,
    "vehiculo_id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "emitido_por_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "request_fingerprint" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL,
    "servicio_nombre" TEXT NOT NULL,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_tipo_documento" "TipoDocumento" NOT NULL,
    "cliente_numero_documento" TEXT NOT NULL,
    "vehiculo_placa" TEXT NOT NULL,
    "vehiculo_marca" TEXT NOT NULL,
    "vehiculo_modelo" TEXT NOT NULL,
    "vehiculo_color" TEXT NOT NULL,
    "vehiculo_tipo" "TipoVehiculo" NOT NULL,
    "estado_turno" "EstadoTurno" NOT NULL DEFAULT 'EN_ESPERA',
    "numero_estacion" INTEGER,
    "lavador_id" UUID,
    "fecha_inicio_lavado" TIMESTAMP(3),
    "fecha_finalizacion" TIMESTAMP(3),
    "fecha_entrega" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_historial_estados" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "estado" "EstadoTurno" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" UUID,

    CONSTRAINT "ticket_historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turno_counters" (
    "fecha" DATE NOT NULL,
    "ultimo" INTEGER NOT NULL,

    CONSTRAINT "turno_counters_pkey" PRIMARY KEY ("fecha")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_tipo_documento_numero_documento_key" ON "clientes"("tipo_documento", "numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE INDEX "vehiculos_cliente_id_idx" ON "vehiculos"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_numero_turno_key" ON "tickets"("numero_turno");

-- CreateIndex
CREATE INDEX "tickets_estado_turno_emitido_en_idx" ON "tickets"("estado_turno", "emitido_en");

-- CreateIndex
CREATE INDEX "tickets_vehiculo_id_estado_turno_idx" ON "tickets"("vehiculo_id", "estado_turno");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_emitido_por_id_idempotency_key_key" ON "tickets"("emitido_por_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_fecha_turno_secuencia_key" ON "tickets"("fecha_turno", "secuencia");

-- CreateIndex
CREATE INDEX "ticket_historial_estados_ticket_id_idx" ON "ticket_historial_estados"("ticket_id");

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios_lavado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_emitido_por_id_fkey" FOREIGN KEY ("emitido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_lavador_id_fkey" FOREIGN KEY ("lavador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_historial_estados" ADD CONSTRAINT "ticket_historial_estados_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_historial_estados" ADD CONSTRAINT "ticket_historial_estados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

