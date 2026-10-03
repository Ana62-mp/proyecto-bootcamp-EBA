import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { VehiclesController } from './api/controllers/vehicles.controller';
import { LookupRateLimiterService } from './application/services/lookup-rate-limiter.service';
import { LookupVehicleUseCase } from './application/use-cases/lookup-vehicle.use-case';
import {
  GetVehicleUseCase,
  UpdateVehicleUseCase,
} from './application/use-cases/manage-vehicle.use-case';
import { RegisterVehicleUseCase } from './application/use-cases/register-vehicle.use-case';
import { VEHICLE_LOOKUP_PORT } from './domain/interfaces/vehicle-lookup.port';
import { VEHICLE_REPOSITORY } from './domain/interfaces/vehicle-repository.port';
import { AntService } from './infrastructure/adapters/ant.service';
import { PrismaVehicleRepository } from './infrastructure/repositories/prisma-vehicle.repository';

@Module({
  imports: [HttpModule],
  controllers: [VehiclesController],
  providers: [
    { provide: VEHICLE_REPOSITORY, useClass: PrismaVehicleRepository },
    { provide: VEHICLE_LOOKUP_PORT, useClass: AntService },
    LookupRateLimiterService,
    LookupVehicleUseCase,
    RegisterVehicleUseCase,
    GetVehicleUseCase,
    UpdateVehicleUseCase,
  ],
})
export class VehiclesModule {}
