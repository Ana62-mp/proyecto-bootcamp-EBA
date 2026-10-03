/**
 * AntService (prototipo)
 * Simula la consulta de datos vehiculares a la ANT (Agencia Nacional de Tránsito) por placa.
 * Si se define VITE_ANT_API_URL, consulta GET {VITE_ANT_API_URL}/vehiculos/{placa}
 * esperando { marca, modelo, color }. Caso contrario usa una base simulada local.
 */

export interface DatosVehiculoAnt {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
}

// Base simulada de vehículos matriculados en Ecuador
const MOCK_ANT_DB: Record<string, Omit<DatosVehiculoAnt, 'placa'>> = {
  'PBH-4321': { marca: 'Chevrolet', modelo: 'Sail', color: 'Plata' },
  'PCD-1234': { marca: 'Toyota', modelo: 'RAV4', color: 'Blanco' },
  'GYE-5678': { marca: 'Kia', modelo: 'Sportage', color: 'Negro' },
  'ABC-1234': { marca: 'Hyundai', modelo: 'Tucson', color: 'Rojo' },
  'PDA-9012': { marca: 'Chevrolet', modelo: 'D-Max', color: 'Gris' },
  'TBA-3456': { marca: 'Mazda', modelo: 'CX-5', color: 'Azul' },
  'IBM-7890': { marca: 'Nissan', modelo: 'Sentra', color: 'Blanco' },
  'HCA-2468': { marca: 'Suzuki', modelo: 'Vitara', color: 'Verde' }
};

const ANT_API_URL: string | undefined = (import.meta as any).env?.VITE_ANT_API_URL;

export const AntService = {
  async consultarPorPlaca(placa: string): Promise<DatosVehiculoAnt | null> {
    const placaNormalizada = placa.trim().toUpperCase();

    if (ANT_API_URL) {
      const response = await fetch(`${ANT_API_URL}/vehiculos/${encodeURIComponent(placaNormalizada)}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('No se pudo conectar con el servicio de la ANT.');
      const data = await response.json();
      return { placa: placaNormalizada, marca: data.marca, modelo: data.modelo, color: data.color };
    }

    // Simula latencia de red
    await new Promise(resolve => setTimeout(resolve, 800));
    const registro = MOCK_ANT_DB[placaNormalizada];
    return registro ? { placa: placaNormalizada, ...registro } : null;
  }
};
