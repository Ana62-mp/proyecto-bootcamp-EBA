import { ApiProperty } from '@nestjs/swagger';
import { VehicleLookupResult } from '../../domain/types/vehicle-lookup.types';

export class VehicleLookupDataDto {
  @ApiProperty({ format: 'uuid', nullable: true, type: String, description: 'UUID local o null' })
  vehicleId!: string | null;
  @ApiProperty({
    nullable: true,
    type: Number,
    example: 2686887,
    description: 'Id externo del proveedor',
  })
  providerVehicleId!: number | null;
  @ApiProperty({ example: 'PBH1234', description: 'Placa canónica' })
  licensePlate!: string;
  @ApiProperty({ nullable: true, type: String, example: 'CAMIONETA' }) vehicleClass!: string | null;
  @ApiProperty({ nullable: true, type: String, example: 'CHEVROLET' }) brand!: string | null;
  @ApiProperty({ nullable: true, type: String, example: 'LUV D-MAX CS 4X2 TM' }) model!:
    string | null;
  @ApiProperty({ nullable: true, type: Number, example: 2007 }) year!: number | null;
  @ApiProperty({ nullable: true, type: String, example: 'ECUADOR' }) country!: string | null;
  @ApiProperty({ nullable: true, type: String, example: 'VINO' }) color!: string | null;
  @ApiProperty({ nullable: true, type: String, example: 'PARTICULAR' }) serviceType!: string | null;
  @ApiProperty({ nullable: true, type: String, example: '2023-09-08', description: 'YYYY-MM-DD' })
  registrationDate!: string | null;
  @ApiProperty({ nullable: true, type: String, example: '2024-09-08', description: 'YYYY-MM-DD' })
  registrationExpiryDate!: string | null;
  @ApiProperty({
    nullable: true,
    type: Number,
    example: 2023,
    description: 'Campo AnioAuto del proveedor',
  })
  providerAutoYear!: number | null;
  @ApiProperty({ nullable: true, type: String, example: null }) chassis!: string | null;
  @ApiProperty({ nullable: true, type: String, example: null }) engineNumber!: string | null;
}

export class VehicleLookupMetaDto {
  @ApiProperty({ enum: ['LOCAL', 'WEBSERVICES_EC'] }) source!: 'LOCAL' | 'WEBSERVICES_EC';
  @ApiProperty({ example: '2026-10-03T19:00:00.000Z', description: 'Momento de esta búsqueda' })
  queriedAt!: string;
  @ApiProperty({
    nullable: true,
    type: String,
    example: '2026-10-03T19:00:00.000Z',
    description: 'Última consulta externa conocida; null en registros locales sin esa información',
  })
  providerQueriedAt!: string | null;
  @ApiProperty({ type: [String], example: ['chassis', 'engineNumber'] }) missingFields!: string[];
}

export class VehicleLookupResponseDto {
  @ApiProperty({ type: VehicleLookupDataDto }) data!: VehicleLookupDataDto;
  @ApiProperty({ type: VehicleLookupMetaDto }) meta!: VehicleLookupMetaDto;

  static from(result: VehicleLookupResult): VehicleLookupResponseDto {
    return {
      data: { vehicleId: result.vehicleId, ...result.data },
      meta: {
        source: result.source,
        queriedAt: result.queriedAt.toISOString(),
        providerQueriedAt: result.providerQueriedAt?.toISOString() ?? null,
        missingFields: result.missingFields,
      },
    };
  }
}
