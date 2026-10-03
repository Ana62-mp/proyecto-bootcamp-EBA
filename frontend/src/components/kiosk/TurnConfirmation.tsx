/**
 * Step 5: Turn Review and Final Confirmation
 * Conforms to Spec Section 8.6
 */
import React from 'react';
import { Cliente, ServicioLavado, Vehiculo } from '../../types';
import { formatCurrency, TIPO_DOCUMENTO_LABELS, TIPO_VEHICULO_LABELS } from '../../utils/formatters';
import { EstadoBadge } from '../common/Badge';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

interface TurnConfirmationProps {
  cliente: Cliente;
  vehiculo: Vehiculo;
  servicio: ServicioLavado;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export const TurnConfirmation: React.FC<TurnConfirmationProps> = ({
  cliente,
  vehiculo,
  servicio,
  isSubmitting,
  onBack,
  onConfirm
}) => {
  const nombreCliente = cliente.razonSocial || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs font-bold text-[#042544] mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#3BBCFD]" />
          <span>Confirmación de turno</span>
        </div>
        <h2 className="text-2xl font-black text-[#042544]">
          Revisa los datos de tu turno
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Verifica que la placa y el servicio sean los correctos antes de generar el comprobante
        </p>
      </div>

      {/* Summary Box */}
      <div className="space-y-4 rounded-xl border border-slate-200 p-5 bg-slate-50/60 mb-6">
        {/* Plate - Hero */}
        <div className="text-center py-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            PLACA DEL VEHÍCULO
          </span>
          <span className="text-3xl font-black font-mono tracking-widest text-[#042544] block my-0.5">
            {vehiculo.placa}
          </span>
          <span className="text-xs font-medium text-slate-600">
            {vehiculo.marca} {vehiculo.modelo} ({vehiculo.color}) · {TIPO_VEHICULO_LABELS[vehiculo.tipoVehiculo]}
          </span>
        </div>

        {/* Customer Info */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Cliente:</span>
            <span className="font-bold text-slate-800">{nombreCliente}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Identificación:</span>
            <span className="font-mono font-semibold text-slate-800">
              {cliente.numeroDocumento} ({TIPO_DOCUMENTO_LABELS[cliente.tipoDocumento]})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Teléfono:</span>
            <span className="font-semibold text-slate-800">{cliente.telefono}</span>
          </div>
        </div>

        {/* Service & Price */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Servicio contratado
            </span>
            <span className="text-base font-black text-[#042544]">
              {servicio.nombre}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-[260px] line-clamp-1">
              {servicio.descripcion}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono text-[#042544] block">
              {formatCurrency(servicio.precio)}
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Pago pendiente en caja
            </span>
          </div>
        </div>

        {/* Initial Status */}
        <div className="flex items-center justify-between px-2 text-xs">
          <span className="text-slate-500">Estado inicial:</span>
          <EstadoBadge estado="EN_ESPERA" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onBack}
          className="py-3.5 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Regresar</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onConfirm}
          className="flex-1 py-4 px-6 rounded-xl bg-[#042544] hover:bg-[#073663] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Generando turno...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-[#3BBCFD]" />
              <span>Confirmar turno</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
