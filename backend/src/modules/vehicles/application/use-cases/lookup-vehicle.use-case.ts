import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { normalizeLookupPlate } from '../../domain/plate';
import { VEHICLE_LOOKUP_PORT } from '../../domain/interfaces/vehicle-lookup.port';
import type { VehicleLookupPort } from '../../domain/interfaces/vehicle-lookup.port';
import { VEHICLE_REPOSITORY } from '../../domain/interfaces/vehicle-repository.port';
import type { VehicleRepositoryPort } from '../../domain/interfaces/vehicle-repository.port';
import {
  missingFieldsOf,
  VehicleData,
  VehicleLookupResult,
  VehicleProviderError,
} from '../../domain/types/vehicle-lookup.types';
import { VehicleRecord } from '../../domain/types/vehicle.types';
import { LookupRateLimiterService } from '../services/lookup-rate-limiter.service';

function localData(vehicle: VehicleRecord): VehicleData {
  return {
    providerVehicleId: vehicle.providerVehicleId,
    licensePlate: vehicle.placa,
    vehicleClass: vehicle.vehicleClass,
    brand: vehicle.marca,
    model: vehicle.modelo,
    year: vehicle.year,
    country: vehicle.country,
    color: vehicle.color,
    serviceType: vehicle.serviceType,
    registrationDate: vehicle.registrationDate,
    registrationExpiryDate: vehicle.registrationExpiryDate,
    providerAutoYear: vehicle.providerAutoYear,
    chassis: vehicle.chassis,
    engineNumber: vehicle.engineNumber,
  };
}

function providerError(error: VehicleProviderError): AppException {
  switch (error.kind) {
    case 'TIMEOUT':
      return new AppException(
        HttpStatus.GATEWAY_TIMEOUT,
        'VEHICLE_PROVIDER_TIMEOUT',
        'El servicio de consulta vehicular no respondió a tiempo.',
      );
    case 'UNAVAILABLE':
      return new AppException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'VEHICLE_PROVIDER_UNAVAILABLE',
        'El servicio de consulta vehicular no está disponible.',
      );
    case 'INVALID_RESPONSE':
      return new AppException(
        HttpStatus.BAD_GATEWAY,
        'VEHICLE_PROVIDER_INVALID_RESPONSE',
        'El servicio de consulta vehicular devolvió una respuesta inválida.',
      );
  }
}

/**
 * Consulta de solo lectura (§13.3): primero base local, luego webservices.ec.
 * No crea vehículos, clientes ni tickets y no emite eventos WebSocket.
 */
@Injectable()
export class LookupVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepositoryPort,
    @Inject(VEHICLE_LOOKUP_PORT) private readonly provider: VehicleLookupPort,
    private readonly rateLimiter: LookupRateLimiterService,
  ) {}

  async execute(actorId: string, rawPlate: string): Promise<VehicleLookupResult> {
    const plate = normalizeLookupPlate(rawPlate);
    if (!plate) {
      throw AppException.badRequest(
        'INVALID_LICENSE_PLATE',
        'Placa inválida. Usa 3 letras y 4 dígitos (PBH1234) o 2 letras y 4 dígitos (IA-7000).',
        [{ field: 'licensePlate', message: 'Formato de placa no permitido.' }],
      );
    }

    if (!this.rateLimiter.tryConsume(actorId)) {
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        'LOOKUP_RATE_LIMITED',
        'Demasiadas consultas de placa. Espera un momento e intenta nuevamente.',
      );
    }

    const queriedAt = new Date();
    const local = await this.vehicles.findByPlaca(plate.licensePlate);
    if (local) {
      const data = localData(local);
      return {
        vehicleId: local.id,
        data,
        source: 'LOCAL',
        queriedAt,
        providerQueriedAt: local.providerQueriedAt,
        missingFields: missingFieldsOf(data),
      };
    }

    let outcome;
    try {
      outcome = await this.provider.lookup(plate.providerQuery, plate.licensePlate);
    } catch (error) {
      if (error instanceof VehicleProviderError) throw providerError(error);
      throw error;
    }

    if (!outcome.found) {
      throw AppException.notFound(
        'VEHICLE_NOT_FOUND',
        'No se encontró el vehículo. Revisa la placa o registra los datos manualmente.',
      );
    }

    // Se conserva el resultado para registrar la procedencia al confirmar el vehículo.
    await this.vehicles.saveLookupSnapshot({ ...outcome.data, queriedAt });

    return {
      vehicleId: null,
      data: outcome.data,
      source: 'WEBSERVICES_EC',
      queriedAt,
      providerQueriedAt: queriedAt,
      missingFields: missingFieldsOf(outcome.data),
    };
  }
}
