/**
 * Step 4: Service Selection & Price Cards
 * Conforms to Spec Section 8.5
 */
import React from 'react';
import { ServicioLavado } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface ServiceSelectorProps {
  servicios: ServicioLavado[];
  selectedServicioId: number | null;
  onSelectServicio: (idServicio: number) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  servicios,
  selectedServicioId,
  onSelectServicio,
  onBack,
  onContinue
}) => {
  // Only display active services
  const activeServices = servicios.filter(s => s.activo);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs font-bold text-[#042544] mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#3BBCFD]" />
          <span>Paso 4 de 5</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#042544]">
          Selecciona tu servicio
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Todos los precios incluyen IVA. Elige el tipo de lavado que deseas para tu vehículo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activeServices.map(servicio => {
          const isSelected = selectedServicioId === servicio.idServicio;

          return (
            <div
              key={servicio.idServicio}
              onClick={() => onSelectServicio(servicio.idServicio)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                isSelected
                  ? 'border-[#3BBCFD] bg-sky-50/50 shadow-md ring-2 ring-[#3BBCFD]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white shadow-xs'
              }`}
            >
              {/* Radio selection indicator */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-black text-[#042544]">
                  {servicio.nombre}
                </h3>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                    isSelected
                      ? 'bg-[#3BBCFD] text-white border-[#3BBCFD]'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed flex-1">
                {servicio.descripcion}
              </p>

              <div className="pt-4 border-t border-slate-200/80 flex items-baseline justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Precio final
                </span>
                <span className="text-2xl font-black font-mono text-[#042544]">
                  {formatCurrency(servicio.precio)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 max-w-xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="py-3.5 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Regresar</span>
        </button>

        <button
          type="button"
          disabled={!selectedServicioId}
          onClick={onContinue}
          className="flex-1 py-4 px-6 rounded-xl bg-[#042544] hover:bg-[#073663] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Confirmar selección</span>
          <ArrowRight className="w-4 h-4 text-[#3BBCFD]" />
        </button>
      </div>
    </div>
  );
};
