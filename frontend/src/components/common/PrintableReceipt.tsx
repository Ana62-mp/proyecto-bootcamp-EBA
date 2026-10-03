/**
 * Printable Receipt Component
 * Strictly conforms to Section 9 of the Spec Maestro Definitivo (80mm thermal printer format).
 */
import React from 'react';
import { TurnoCarwash } from '../../types';
import { useCarWash } from '../../context/CarWashContext';
import { formatCurrency, formatDateTime, TIPO_DOCUMENTO_LABELS, TIPO_VEHICULO_LABELS } from '../../utils/formatters';
import { Printer } from 'lucide-react';

interface PrintableReceiptProps {
  turno: TurnoCarwash;
  onDone?: () => void;
  showPrintButton?: boolean;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  turno,
  showPrintButton = true
}) => {
  const { getClienteById, getVehiculoById, getServicioById } = useCarWash();

  const cliente = getClienteById(turno.idCliente);
  const vehiculo = cliente ? getVehiculoById(turno.idCliente, turno.idVehiculo) : undefined;
  const servicio = getServicioById(turno.idServicio);

  const handlePrint = () => {
    window.print();
  };

  const nombreCliente = cliente
    ? cliente.razonSocial || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
    : 'Cliente Car Wash';

  return (
    <div className="flex flex-col items-center w-full">
      {showPrintButton && (
        <div className="w-full max-w-sm mb-4 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-3 px-4 rounded-xl bg-[#042544] hover:bg-[#063560] text-white font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
          >
            <Printer className="w-5 h-5 text-[#3BBCFD]" />
            <span>Imprimir comprobante</span>
          </button>
        </div>
      )}

      {/* 80mm Thermal Receipt Structure */}
      <div
        id="printable-receipt"
        className="w-full max-w-[320px] bg-white border border-slate-300 rounded-lg p-5 font-mono text-slate-900 shadow-sm print:border-none print:shadow-none print:p-2 text-[12px] leading-tight"
      >
        {/* Header */}
        <div className="text-center pb-3 border-b border-dashed border-slate-400">
          <div className="text-lg font-black tracking-wider uppercase font-sans text-slate-900 mb-0.5">
            CAR WASH EXPRESS
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">
            SISTEMA DE TURNOS INMEDIATOS
          </div>
          <div className="text-xs font-bold uppercase mt-1">COMPROBANTE DE TURNO</div>
          <div className="text-sm font-black text-slate-900 mt-1">
            TURNO #{turno.idTurno}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            {formatDateTime(turno.fechaIngreso)}
          </div>
        </div>

        {/* Vehicle - Prominent */}
        <div className="py-3 text-center border-b border-dashed border-slate-400 bg-slate-50/80 my-2 rounded">
          <div className="text-[10px] uppercase font-bold text-slate-500">PLACA DEL VEHÍCULO</div>
          <div className="text-2xl font-black tracking-widest text-slate-900 font-mono my-1">
            {vehiculo?.placa || 'ABC-1234'}
          </div>
          <div className="text-[11px] text-slate-700">
            {vehiculo?.marca} {vehiculo?.modelo} ({vehiculo?.color})
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {vehiculo ? TIPO_VEHICULO_LABELS[vehiculo.tipoVehiculo] : 'Vehículo'}
          </div>
        </div>

        {/* Customer Information */}
        <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Cliente:</span>
            <span className="font-semibold text-right max-w-[170px] truncate">{nombreCliente}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">
              {cliente ? TIPO_DOCUMENTO_LABELS[cliente.tipoDocumento] : 'Doc'}:
            </span>
            <span className="font-mono">{cliente?.numeroDocumento || '---'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Teléfono:</span>
            <span>{cliente?.telefono || '---'}</span>
          </div>
        </div>

        {/* Service & Price */}
        <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-[12px]">{servicio?.nombre || 'Servicio de Lavado'}</span>
            <span className="text-sm font-black font-mono">
              {formatCurrency(turno.precioServicio)}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Estado de pago:</span>
            <span className="font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded text-[10px] uppercase">
              PENDIENTE
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Ubicación asignada:</span>
            <span className="font-bold">
              {turno.numeroEstacion ? `Estación ${turno.numeroEstacion}` : 'En Cola de Espera'}
            </span>
          </div>
        </div>

        {/* Mandatory Customer Notice */}
        <div className="pt-3 pb-2 text-center space-y-2">
          <p className="font-bold text-[11px] leading-tight text-slate-900 border border-slate-300 p-2 rounded bg-slate-50">
            Realice el pago en caja y, después de pagar, diríjase al parqueadero para continuar con el servicio.
          </p>
          <p className="text-[10px] text-slate-600 italic">
            Conserve este comprobante hasta retirar su vehículo.
          </p>
        </div>

        {/* Barcode representation */}
        <div className="pt-2 text-center border-t border-slate-300 flex flex-col items-center">
          <div className="h-7 w-48 bg-repeat-x bg-[linear-gradient(90deg,#000_1px,transparent_1px,#000_3px,transparent_2px,#000_2px,transparent_4px)]"></div>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">
            TRN-{turno.idTurno}-{vehiculo?.placa.replace('-', '') || '0000'}
          </span>
        </div>
      </div>
    </div>
  );
};
