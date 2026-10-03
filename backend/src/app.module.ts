import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { validateConfig } from './context/config/app.config';
import { PrismaModule } from './context/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { HealthController } from './modules/health/health.controller';
import { ServiciosModule } from './modules/servicios/servicios.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateConfig }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ClientesModule,
    VehiclesModule,
    ServiciosModule,
    TicketsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Orden: primero autenticación, después roles.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
