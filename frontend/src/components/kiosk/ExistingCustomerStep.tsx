/**
 * Step 2A: Existing Customer Welcome & Vehicle Selection
 * Conforms to Spec Section 8.2
 */
import React from 'react';
import { Cliente, Vehiculo } from '../../types';
import { TIPO_DOCUMENTO_LABELS, TIPO_VEHICULO_LABELS } from '../../utils/formatters';
import { UserCheck, Car, Plus, ArrowRight, RotateCcw, Check } from 'lucide-react';

interface ExistingCustomerStepProps {
  cliente: Cliente;
  selectedVehiculoId: number | null;
  onSelectVehiculo: (idVehiculo: number) => void;
  onAddNewVehicle: () => void;
  onNotMe: () => void;
  onContinue: () => void;
}

export const ExistingCustomerStep: React.FC<ExistingCustomerStepProps> = ({
  cliente,
  selectedVehiculoId,
  onSelectVehiculo,
  onAddNewVehicle,
  onNotMe,
  onContinue
}) => {
  const nombreMostrar = cliente.razonSocial || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
  const activeVehicles = cliente.vehiculos.filter(v => v.activo);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
              <UserCheck className="w-4 h-4" />
              <span>Cliente registrado</span>
            </div>
            <h2 className="text-2xl font-black text-[#042544]">
              ¡Qué gusto verte de nuevo!
            </h2>
            <p className="text-lg font-bold text-slate-800 mt-1">{nombreMostrar}</p>
          </div>

          <button
            type="button"
            onClick={onNotMe}
            className="self-start sm:self-auto py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Este no soy yo</span>
          </button>
        </div>

        {/* Read-only Data */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Documento</span>
            <span className="font-mono font-bold text-slate-800">
              {cliente.numeroDocumento}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              {TIPO_DOCUMENTO_LABELS[cliente.tipoDocumento]}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Teléfono</span>
            <span className="font-bold text-slate-800">{cliente.telefono}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Correo electrónico</span>
            <span className="font-bold text-slate-800 truncate block">
              {cliente.correo || 'No registrado'}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Selection Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#042544]">
              Selecciona tu vehículo
            </h3>
            <p className="text-xs text-slate-500">
              Escoge el auto con el que nos visitas hoy o registra uno nuevo
            </p>
          </div>

          <button
            type="button"
            onClick={onAddNewVehicle}
            className="py-2 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#042544] font-bold text-xs flex items-center gap-1.5 border border-sky-200 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#3BBCFD]" />
            <span>Registrar otro vehículo</span>
          </button>
        </div>

        {activeVehicles.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No tienes vehículos registrados</p>
            <p className="text-xs text-slate-500 mb-4">Agrega los datos de tu vehículo para continuar</p>
            <button
              type="button"
              onClick={onAddNewVehicle}
              className="py-2.5 px-4 rounded-xl bg-[#042544] text-white font-bold text-xs"
            >
              Registrar vehículo ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            {activeVehicles.map(v => {
              const isSelected = selectedVehiculoId === v.idVehiculo;
              return (
                <div
                  key={v.idVehiculo}
                  onClick={() => onSelectVehiculo(v.idVehiculo)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[110px] ${
                    isSelected
                      ? 'border-[#3BBCFD] bg-sky-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        {TIPO_VEHICULO_LABELS[v.tipoVehiculo]}
                      </span>
                      <div className="text-xl font-black font-mono tracking-widest text-[#042544] mt-0.5">
                        {v.placa}
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? 'bg-[#3BBCFD] text-white border-[#3BBCFD]'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-700 mt-2">
                    {v.marca} {v.modelo} · <span className="text-slate-500 font-normal">{v.color}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continue Button */}
        {activeVehicles.length > 0 && (
          <button
            type="button"
            disabled={!selectedVehiculoId}
            onClick={onContinue}
            className="w-full py-4 px-6 rounded-xl bg-[#042544] hover:bg-[#073663] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Continuar con este vehículo</span>
            <ArrowRight className="w-5 h-5 text-[#3BBCFD]" />
          </button>
        )}
      </div>
    </div>
  );
};
