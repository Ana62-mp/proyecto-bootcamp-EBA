/**
 * Step 3: Vehicle Registration Form
 * Conforms to Spec Section 8.4
 */
import React, { useState } from 'react';
import { TipoVehiculo, Vehiculo } from '../../types';
import { normalizarYValidarPlaca, formatearPlacaEnTiempoReal } from '../../utils/documentValidators';
import { useCarWash } from '../../context/CarWashContext';
import { Car, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

interface VehicleFormProps {
  idCliente: number;
  onBack: () => void;
  onSubmit: (vehiculo: Omit<Vehiculo, 'idVehiculo' | 'idCliente' | 'activo'>) => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  idCliente,
  onBack,
  onSubmit
}) => {
  const { clientes, turnos } = useCarWash();

  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>('AUTOMOVIL');
  const [error, setError] = useState('');

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    // Auto-inserts '-' after 3 letters and strictly limits to letters + hyphen + up to 4 digits
    const formatted = formatearPlacaEnTiempoReal(e.target.value);
    setPlaca(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = normalizarYValidarPlaca(placa);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Placa inválida.');
      return;
    }

    const placaFinal = validation.cleanedValue;

    // Check if plate belongs to another client
    const otherClient = clientes.find(
      c => c.idCliente !== idCliente && c.vehiculos.some(v => v.placa === placaFinal)
    );
    if (otherClient) {
      setError('Esta placa ya se encuentra registrada. Solicita asistencia al personal.');
      return;
    }

    // Check if plate has an active turn
    const activeStates = ['EN_ESPERA', 'LAVANDO', 'SECANDO_PULIENDO', 'LISTO'];
    const activeTurn = turnos.find(t => {
      if (!activeStates.includes(t.estado)) return false;
      // find vehicle
      for (const c of clientes) {
        const v = c.vehiculos.find(veh => veh.idVehiculo === t.idVehiculo);
        if (v && v.placa === placaFinal) return true;
      }
      return false;
    });

    if (activeTurn) {
      setError('Este vehículo ya tiene un turno activo en el sistema. Debe retirarse o entregarse antes de generar otro.');
      return;
    }

    if (!marca.trim()) {
      setError('Por favor indica la marca del vehículo.');
      return;
    }
    if (!modelo.trim()) {
      setError('Por favor indica el modelo del vehículo.');
      return;
    }
    if (!color.trim()) {
      setError('Por favor indica el color del vehículo.');
      return;
    }

    onSubmit({
      placa: placaFinal,
      marca: marca.trim(),
      modelo: modelo.trim(),
      color: color.trim(),
      tipoVehiculo
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs font-bold text-[#042544] mb-2">
          <Car className="w-3.5 h-3.5 text-[#3BBCFD]" />
          <span>Datos del vehículo</span>
        </div>
        <h2 className="text-2xl font-black text-[#042544]">
          Registra tu vehículo
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Ingresa la placa y características de tu auto para asignarle el servicio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Placa Field */}
        <div>
          <label htmlFor="placa" className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Placa del vehículo *
          </label>
          <div className="relative">
            <input
              id="placa"
              type="text"
              autoFocus
              value={placa}
              onChange={handlePlacaChange}
              placeholder="Ejemplo: ABC-1234"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-xl tracking-widest font-black uppercase text-[#042544] bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3BBCFD]"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Formato ecuatoriano estándar: 3 letras y 3 o 4 dígitos (Ej: PBH-4321).
          </p>
        </div>

        {/* Tipo de Vehículo Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Tipo de carrocería *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { type: 'AUTOMOVIL' as TipoVehiculo, label: 'Automóvil' },
              { type: 'SUV' as TipoVehiculo, label: 'SUV / Crossover' },
              { type: 'CAMIONETA' as TipoVehiculo, label: 'Camioneta' },
              { type: 'OTRO' as TipoVehiculo, label: 'Otro' }
            ].map(item => (
              <button
                key={item.type}
                type="button"
                onClick={() => setTipoVehiculo(item.type)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-colors ${
                  tipoVehiculo === item.type
                    ? 'bg-[#042544] text-white border-[#042544]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Marca & Modelo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="marca" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Marca *
            </label>
            <input
              id="marca"
              type="text"
              value={marca}
              onChange={e => setMarca(e.target.value)}
              placeholder="Ej: Chevrolet, Toyota"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] text-sm"
            />
          </div>

          <div>
            <label htmlFor="modelo" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Modelo *
            </label>
            <input
              id="modelo"
              type="text"
              value={modelo}
              onChange={e => setModelo(e.target.value)}
              placeholder="Ej: Sail, RAV4, D-Max"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] text-sm"
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <label htmlFor="color" className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Color *
          </label>
          <input
            id="color"
            type="text"
            value={color}
            onChange={e => setColor(e.target.value)}
            placeholder="Ej: Blanco, Plata, Negro, Rojo"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] text-sm"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Regresar</span>
          </button>

          <button
            type="submit"
            className="flex-1 py-3.5 px-6 rounded-xl bg-[#042544] hover:bg-[#073663] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Continuar al servicio</span>
            <ArrowRight className="w-4 h-4 text-[#3BBCFD]" />
          </button>
        </div>
      </form>
    </div>
  );
};
