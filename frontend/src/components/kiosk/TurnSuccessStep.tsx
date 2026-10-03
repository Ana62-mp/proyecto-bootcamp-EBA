/**
 * Step 6: Turn Success and Printable Receipt View
 * Conforms to Spec Section 9.1
 */
import React from 'react';
import { TurnoCarwash } from '../../types';
import { useCarWash } from '../../context/CarWashContext';
import { formatCurrency } from '../../utils/formatters';
import { PrintableReceipt } from '../common/PrintableReceipt';
import { CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

interface TurnSuccessStepProps {
  turno: TurnoCarwash;
  onFinish: () => void;
}

export const TurnSuccessStep: React.FC<TurnSuccessStepProps> = ({
  turno,
  onFinish
}) => {
  const { getVehiculoByOnlyId } = useCarWash();
  const vehiculo = getVehiculoByOnlyId(turno.idVehiculo);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* On-Screen Success Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-emerald-200 text-center print:hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#042544]">
          ¡Turno generado con éxito!
        </h2>
        <p className="text-sm text-slate-600 mt-1 mb-6">
          Tu vehículo ha sido ingresado al sistema de lavado
        </p>

        {/* Hero Plate & Turn Display */}
        <div className="p-6 rounded-2xl bg-[#042544] text-white shadow-lg mb-6">
          <span className="text-xs uppercase font-bold tracking-widest text-[#3BBCFD] block mb-1">
            PLACA REGISTRADA
          </span>
          <span className="text-4xl sm:text-5xl font-black font-mono tracking-widest block my-2">
            {vehiculo?.placa || 'ABC-1234'}
          </span>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[#BFC3CC] border-t border-[#073663] pt-3 mt-3">
            <span>
              Turno interno: <strong className="text-white font-mono text-sm">#{turno.idTurno}</strong>
            </span>
            <span>·</span>
            <span>
              Ubicación:{' '}
              <strong className="text-[#3BBCFD] font-bold">
                {turno.numeroEstacion ? `Estación ${turno.numeroEstacion}` : 'En Cola FIFO'}
              </strong>
            </span>
          </div>
        </div>

        {/* Payment Warning Callout */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold block">Paso siguiente obligatorio:</strong>
            Realice el pago de{' '}
            <strong className="font-mono font-bold text-slate-900">
              {formatCurrency(turno.precioServicio)}
            </strong>{' '}
            en caja y, después de pagar, diríjase al parqueadero para continuar con el servicio.
          </div>
        </div>

        {/* Printable Receipt Preview & Print Action */}
        <div className="border-t border-slate-200 pt-6 flex flex-col items-center">
          <PrintableReceipt turno={turno} showPrintButton={true} />
        </div>

        {/* Finish Action */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onFinish}
            className="w-full py-3.5 px-6 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Finalizar y nuevo turno</span>
          </button>
        </div>
      </div>
    </div>
  );
};
