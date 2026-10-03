/**
 * ClientDetailModal: Customer Inspection
 * Conforms to Spec Section 17.3
 * Displays complete customer details, vehicles, turn history with historical prices, and receipt reprint.
 */
import React, { useState } from 'react';
import { Cliente, TurnoCarwash } from '../../types';
import { useCarWash } from '../../context/CarWashContext';
import { Modal } from '../common/Modal';
import { EstadoBadge } from '../common/Badge';
import { PrintableReceipt } from '../common/PrintableReceipt';
import {
  formatCurrency,
  formatDateTime,
  TIPO_DOCUMENTO_LABELS,
  TIPO_VEHICULO_LABELS
} from '../../utils/formatters';
import { User, Car, History, Printer, Mail, Phone, Calendar } from 'lucide-react';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  cliente
}) => {
  const { turnos, getVehiculoById, getServicioById } = useCarWash();
  const [selectedTurnoToPrint, setSelectedTurnoToPrint] = useState<TurnoCarwash | null>(null);

  if (!cliente) return null;

  const nombreCompleto = cliente.razonSocial || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();

  // Find all turns for this customer
  const clientTurnos = turnos.filter(t => t.idCliente === cliente.idCliente);

  return (
    <>
      <Modal
        isOpen={isOpen && !selectedTurnoToPrint}
        onClose={onClose}
        title="Ficha del Cliente"
        description={`ID #${cliente.idCliente} · Registrado el ${formatDateTime(cliente.fechaRegistro)}`}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          {/* Header Customer Profile Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#042544] text-white flex items-center justify-center font-bold text-lg">
                {cliente.razonSocial ? cliente.razonSocial.charAt(0) : cliente.nombres?.charAt(0) || 'C'}
              </div>
              <div>
                <h4 className="text-base font-black text-[#042544]">{nombreCompleto}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                  <span>{TIPO_DOCUMENTO_LABELS[cliente.tipoDocumento]}:</span>
                  <span className="font-bold text-slate-800">{cliente.numeroDocumento}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  cliente.activo
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {cliente.activo ? 'Cliente Activo' : 'Cliente Inactivo'}
              </span>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block font-medium">Teléfono</span>
                <span className="font-semibold text-slate-800">{cliente.telefono}</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block font-medium">Correo</span>
                <span className="font-semibold text-slate-800 truncate block max-w-[170px]">
                  {cliente.correo || 'No registrado'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block font-medium">Última actualización</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(cliente.fechaActualizacion)}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Vehicles */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-[#3BBCFD]" />
              <span>Vehículos Registrados ({cliente.vehiculos.length})</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cliente.vehiculos.map(v => (
                <div
                  key={v.idVehiculo}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    v.activo ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="font-mono font-black text-sm tracking-widest text-[#042544]">
                      {v.placa}
                    </div>
                    <div className="text-slate-600 font-medium">
                      {v.marca} {v.modelo} · {v.color}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {TIPO_VEHICULO_LABELS[v.tipoVehiculo]}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      v.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {v.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Turn History */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#3BBCFD]" />
              <span>Historial de Turnos ({clientTurnos.length})</span>
            </h5>

            {clientTurnos.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-xl">
                Este cliente no cuenta con turnos registrados aún.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Turno</th>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Vehículo</th>
                        <th className="py-2.5 px-3">Servicio</th>
                        <th className="py-2.5 px-3">Precio</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Comprobante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {clientTurnos.map(turno => {
                        const vehiculo = getVehiculoById(cliente.idCliente, turno.idVehiculo);
                        const servicio = getServicioById(turno.idServicio);

                        return (
                          <tr key={turno.idTurno} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              #{turno.idTurno}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                              {formatDateTime(turno.fechaIngreso)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold">
                              {vehiculo?.placa || '---'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800">
                              {servicio?.nombre || 'Servicio'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {formatCurrency(turno.precioServicio)}
                            </td>
                            <td className="py-2.5 px-3">
                              <EstadoBadge estado={turno.estado} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedTurnoToPrint(turno)}
                                title="Reimprimir comprobante de este turno"
                                className="p-1.5 text-slate-600 hover:text-[#042544] hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 font-semibold"
                              >
                                <Printer className="w-3.5 h-3.5 text-[#3BBCFD]" />
                                <span>Reimprimir</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-[#042544] text-white text-xs font-bold"
            >
              Cerrar ficha
            </button>
          </div>
        </div>
      </Modal>

      {/* Standalone Reprint Modal */}
      {selectedTurnoToPrint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTurnoToPrint(null)}
          title={`Reimpresión de Comprobante - Turno #${selectedTurnoToPrint.idTurno}`}
          description="Reimpresión administrativa sin duplicar turnos."
          maxWidth="md"
        >
          <div className="flex flex-col items-center">
            <PrintableReceipt turno={selectedTurnoToPrint} showPrintButton={true} />
            <button
              type="button"
              onClick={() => setSelectedTurnoToPrint(null)}
              className="mt-4 px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cerrar vista de impresión
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};
