/**
 * EstacionesPage: Operational Stations Management
 * Conforms to Spec Section 11 & 13
 */
import React from 'react';
import { useCarWash } from '../context/CarWashContext';
import { StationCard } from '../components/stations/StationCard';

export const EstacionesPage: React.FC = () => {
  const { estacion1Turno, estacion2Turno, avanzarEstado } = useCarWash();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#042544]">
          Estaciones Operativas
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Control de avance de etapas para los vehículos asignados en las bahías de lavado.
        </p>
      </div>

      {/* Grid of the two stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StationCard
          numeroEstacion={1}
          turno={estacion1Turno}
          onAdvance={avanzarEstado}
        />

        <StationCard
          numeroEstacion={2}
          turno={estacion2Turno}
          onAdvance={avanzarEstado}
        />
      </div>

      {/* Operational guidelines footer note */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
        <span className="font-bold text-slate-700 block">
          Flujo de etapas automáticas:
        </span>
        <p>
          1. <strong>Lavando:</strong> Lavado con shampoo y agua a presión. Al terminar, presiona &ldquo;Pasar a Secado y Pulido&rdquo;.
        </p>
        <p>
          2. <strong>Secado y Pulido:</strong> Detallado y aspirado. Al presionar &ldquo;Marcar como listo y continuar&rdquo;, el vehículo se libera al parqueadero y la estación recibe automáticamente al siguiente vehículo en cola.
        </p>
      </div>
    </div>
  );
};
