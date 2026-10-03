/**
 * StationCard Component
 * Conforms to Spec Section 11 & 13:
 * - Free state: "DISPONIBLE", message "Estación libre para recibir vehículo", NO manual call button.
 * - Occupied state: Station number, prominent plate, customer, service, entry time, elapsed time, current stage badge.
 * - Single valid advance action.
 */
import React, { useState, useEffect } from 'react';
import { TurnoCarwash } from '../../types';
import { useCarWash } from '../../context/CarWashContext';
import { EstadoBadge } from '../common/Badge';
import { formatTime, getElapsedTime } from '../../utils/formatters';
import { Layers, Droplets, Sparkles, CheckCircle2, Clock, User, ArrowRight } from 'lucide-react';

interface StationCardProps {
  numeroEstacion: 1 | 2;
  turno: TurnoCarwash | null;
  onAdvance: (idTurno: number) => Promise<void>;
  canAdvance?: boolean;
}

export const StationCard: React.FC<StationCardProps> = ({
  numeroEstacion,
  turno,
  onAdvance,
  canAdvance = true
}) => {
  const { getClienteById, getVehiculoById, getServicioById } = useCarWash();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState('');

  // Update live elapsed timer every 10 seconds
  useEffect(() => {
    if (!turno) return;
    const calculateTime = () => {
      setElapsed(getElapsedTime(turno.fechaInicioLavado || turno.fechaIngreso));
    };
    calculateTime();
    const interval = setInterval(calculateTime, 10000);
    return () => clearInterval(interval);
  }, [turno]);

  const handleAction = async () => {
    if (!turno || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdvance(turno.idTurno);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFree = !turno;

  if (isFree) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-dashed border-slate-300 shadow-sm flex flex-col justify-between min-h-[360px] relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#042544] flex items-center justify-center font-bold">
              {numeroEstacion}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#042544]">
                Estación {numeroEstacion}
              </h3>
              <span className="text-xs text-slate-500">Bahía operativa</span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            DISPONIBLE
          </span>
        </div>

        {/* Center illustration & free state message */}
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mb-3">
            <Layers className="w-8 h-8 text-slate-300" />
          </div>
          <h4 className="text-base font-bold text-slate-700 mb-1">
            Estación libre para recibir vehículo
          </h4>
          <p className="text-xs text-slate-500 max-w-xs">
            El despachador automático asignará el próximo vehículo en cola de espera en cuanto ingrese un turno.
          </p>
        </div>

        {/* Bottom subtle note: no manual button per spec */}
        <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Asignación automática por despachador FIFO central
        </div>
      </div>
    );
  }

  // Occupied State
  const cliente = getClienteById(turno.idCliente);
  const vehiculo = cliente ? getVehiculoById(turno.idCliente, turno.idVehiculo) : undefined;
  const servicio = getServicioById(turno.idServicio);
  const nombreCliente = cliente
    ? cliente.razonSocial || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
    : 'Cliente';

  const isLavando = turno.estado === 'LAVANDO';
  const isSecando = turno.estado === 'SECANDO_PULIENDO';

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-sky-300 shadow-md flex flex-col justify-between min-h-[360px] relative overflow-hidden">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#042544] text-[#3BBCFD] flex items-center justify-center font-black text-lg">
              {numeroEstacion}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#042544]">
                Estación {numeroEstacion}
              </h3>
              <span className="text-xs text-slate-500">Turno #{turno.idTurno}</span>
            </div>
          </div>

          <EstadoBadge estado={turno.estado} size="md" />
        </div>

        {/* Prominent Vehicle Plate */}
        <div className="my-5 p-5 bg-gradient-to-r from-slate-50 to-slate-100/60 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
            PLACA EN ATENCIÓN
          </span>
          <span className="text-4xl font-black font-mono tracking-widest text-[#042544] block my-1">
            {vehiculo?.placa || 'ABC-1234'}
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {vehiculo?.marca} {vehiculo?.modelo} · {vehiculo?.color}
          </span>
        </div>

        {/* Service and Customer Info */}
        <div className="space-y-2 text-xs mb-6">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Cliente:</span>
            </span>
            <span className="font-bold text-slate-800 truncate max-w-[200px]">
              {nombreCliente}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Servicio:</span>
            <span className="font-bold text-slate-800">{servicio?.nombre}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Hora ingreso / Tiempo:</span>
            </span>
            <span className="font-mono font-semibold text-slate-800">
              {formatTime(turno.fechaInicioLavado || turno.fechaIngreso)} ({elapsed})
            </span>
          </div>
        </div>
      </div>

      {/* Advance Action Button */}
      {canAdvance && (
        <div className="pt-4 border-t border-slate-100">
          {isLavando && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAction}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Pasar a Secado y Pulido</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isSecando && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAction}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Marcar como listo y continuar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
