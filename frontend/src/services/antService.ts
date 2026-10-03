/**
 * AntService: consulta de datos vehiculares por placa a través del backend
 * (GET /api/vehicles/lookup). El backend busca primero en la base local y luego en
 * webservices.ec; el token del proveedor nunca llega al navegador.
 */
import { ApiError, apiRequest } from './api';
import { formatPlaca } from './mappers';

export interface DatosVehiculoAnt {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  origen: 'LOCAL' | 'WEBSERVICES_EC';
}

interface LookupResponse {
  data: {
    licensePlate: string;
    brand: string | null;
    model: string | null;
    color: string | null;
  };
  meta: { source: 'LOCAL' | 'WEBSERVICES_EC' };
}

export const MENSAJE_FALLO_CONSULTA =
  'No se pudo consultar el servicio. Intenta nuevamente o completa los datos manualmente.';

export const AntService = {
  /**
   * Devuelve los datos o null si el vehículo no existe (404).
   * Lanza ApiError con mensaje para placa inválida o fallo del proveedor.
   */
  async consultarPorPlaca(placa: string, signal?: AbortSignal): Promise<DatosVehiculoAnt | null> {
    try {
      const { data, meta } = await apiRequest<LookupResponse>('/vehicles/lookup', {
        query: { licensePlate: placa.trim() },
        signal
      });
      return {
        placa: formatPlaca(data.licensePlate),
        marca: data.brand ?? '',
        modelo: data.model ?? '',
        color: data.color ?? '',
        origen: meta.source
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'VEHICLE_NOT_FOUND') return null;
        if (error.code === 'INVALID_LICENSE_PLATE' || error.code === 'LOOKUP_RATE_LIMITED') throw error;
        throw new ApiError(MENSAJE_FALLO_CONSULTA, error.status, error.code);
      }
      throw error;
    }
  }
};
