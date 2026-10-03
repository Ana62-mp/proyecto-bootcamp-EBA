/**
 * Ejemplo del botón «Validar» (§13.7) contra GET /api/vehicles/lookup.
 * Reemplaza la simulación local de frontend/src/services/antService.ts: el token de
 * webservices.ec vive solo en el backend.
 */

export interface VehicleLookupData {
  vehicleId: string | null;
  providerVehicleId: number | null;
  licensePlate: string;
  vehicleClass: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  country: string | null;
  color: string | null;
  serviceType: string | null;
  registrationDate: string | null;
  registrationExpiryDate: string | null;
  providerAutoYear: number | null;
  chassis: string | null;
  engineNumber: string | null;
}

export interface VehicleLookupMeta {
  source: 'LOCAL' | 'WEBSERVICES_EC';
  queriedAt: string;
  providerQueriedAt: string | null;
  missingFields: string[];
}

export type LookupOutcome =
  | { kind: 'FOUND'; data: VehicleLookupData; meta: VehicleLookupMeta }
  | { kind: 'NOT_FOUND'; message: string }
  | { kind: 'INVALID'; message: string }
  | { kind: 'ERROR'; message: string };

export const NOT_FOUND_MESSAGE =
  'No se encontró el vehículo. Revisa la placa o registra los datos manualmente';
export const PROVIDER_ERROR_MESSAGE =
  'No se pudo consultar el servicio. Intenta nuevamente o completa los datos manualmente';

/**
 * Controla una consulta a la vez: si la placa cambia o se pulsa «Validar» otra vez, la petición
 * anterior se cancela y su respuesta se descarta, así un resultado atrasado no llena el formulario.
 */
export class VehicleLookupController {
  private controller: AbortController | null = null;
  private currentPlate: string | null = null;

  constructor(
    private readonly apiUrl: string,
    private readonly getAccessToken: () => string,
  ) {}

  /** Llamar en cada cambio del input de placa: invalida el resultado anterior. */
  invalidate(): void {
    this.controller?.abort();
    this.controller = null;
    this.currentPlate = null;
  }

  async validate(plateInput: string): Promise<LookupOutcome | null> {
    this.invalidate();
    const plate = plateInput.trim();
    const controller = new AbortController();
    this.controller = controller;
    this.currentPlate = plate;

    try {
      const response = await fetch(
        `${this.apiUrl}/api/vehicles/lookup?licensePlate=${encodeURIComponent(plate)}`,
        {
          headers: { Authorization: `Bearer ${this.getAccessToken()}` },
          signal: controller.signal,
        },
      );
      const result = (await response.json()) as
        | { data: VehicleLookupData; meta: VehicleLookupMeta }
        | { error: { code: string; message: string } };

      // La pantalla cambió de placa mientras se consultaba: descartar.
      if (this.currentPlate !== plate) return null;

      if (response.ok && 'data' in result) return { kind: 'FOUND', ...result };
      const code = 'error' in result ? result.error.code : '';
      if (code === 'VEHICLE_NOT_FOUND') return { kind: 'NOT_FOUND', message: NOT_FOUND_MESSAGE };
      if (code === 'INVALID_LICENSE_PLATE' && 'error' in result) {
        return { kind: 'INVALID', message: result.error.message };
      }
      return { kind: 'ERROR', message: PROVIDER_ERROR_MESSAGE };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return null;
      return { kind: 'ERROR', message: PROVIDER_ERROR_MESSAGE };
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }
}

/*
Uso en VehicleForm (React):

  const lookup = useMemo(() => new VehicleLookupController(API_URL, () => session.accessToken), []);

  const handlePlacaChange = (e) => { lookup.invalidate(); setResultado(null); setPlaca(...); };

  const handleValidar = async () => {
    setValidando(true);                       // botón deshabilitado, texto «Validando…»
    const outcome = await lookup.validate(placa);
    setValidando(false);
    if (!outcome) return;                     // respuesta de otra placa: ignorada
    if (outcome.kind === 'FOUND') {
      const d = outcome.data;
      setMarca(d.brand ?? ''); setModelo(d.model ?? ''); setColor(d.color ?? '');
      setAnio(d.year); setClase(d.vehicleClass); setPais(d.country); setServicio(d.serviceType);
      // Detalles: d.registrationDate, d.registrationExpiryDate, d.chassis, d.engineNumber.
      // Origen: outcome.meta.source === 'LOCAL' ? 'Base local' : 'webservices.ec'.
      // Una matrícula caducada se muestra como dato informativo; no bloquea el lavado.
    } else {
      setMensaje(outcome.message);            // registro manual con las validaciones de siempre
    }
  };

Después, confirmar el registro con POST /api/vehicles ({ clienteId, placa, tipoVehiculo, marca,
modelo, color, year?, vehicleClass?, country?, serviceType? }) y usar data.id como vehiculoId
al emitir el ticket. La consulta no acredita titularidad.
*/
