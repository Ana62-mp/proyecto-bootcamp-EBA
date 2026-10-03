/**
 * ResumenPage: Operational Overview Dashboard
 * Conforms to Spec Section 15
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarWash } from '../context/CarWashContext';
import { EstadoBadge } from '../components/common/Badge';
import { PrintableReceipt } from '../components/common/PrintableReceipt';
import { Modal } from '../components/common/Modal';
import {
  formatCurrency,
  formatTime,
  getElapsedTime
} from '../utils/formatters';
import {
  Clock,
  Droplets,
  CheckCircle2,
  Layers,
  ArrowRight,
  Printer,
  CheckSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const ResumenPage: React.FC = () => {
  const {
    turnosEnEspera,
    turnosEnProceso,
    turnosListos,
    estacion1Turno,
    estacion2Turno,
    entregarTurno,
    getClienteById,
    getVehiculoById,
    getServicioById
  } = useCarWash();

  const [turnoToDeliver, setTurnoToDeliver] = useState<number | null>(null);
  const [turnoToReprint, setTurnoToReprint] = useState<any | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);

  const handleConfirmDeliver = async () => {
    if (!turnoToDeliver) return;
    setIsDelivering(true);
    try {
      await entregarTurno(turnoToDeliver);
      setTurnoToDeliver(null);
    } finally {
      setIsDelivering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#042544]">
            Resumen Operativo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en tiempo real de bahías, cola de espera y entregas de vehículos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/estaciones"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-[#3BBCFD]" />
            <span>Gestionar estaciones</span>
          </Link>
          <Link
            to="/turnos/nuevo"
            className="px-4 py-2 rounded-xl bg-[#042544] hover:bg-[#073663] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>+ Nuevo turno</span>
          </Link>
        </div>
      </div>

      {/* Two Stations Live Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estación 1 */}
        <div
          className={`p-5 rounded-2xl border-2 transition-all bg-white shadow-xs ${
            estacion1Turno ? 'border-sky-300' : 'border-dashed border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#042544] text-[#3BBCFD] flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-extrabold text-[#042544] text-sm">Estación 1</h3>
            </div>
            {estacion1Turno ? (
              <EstadoBadge estado={estacion1Turno.estado} size="sm" />
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                DISPONIBLE
              </span>
            )}
          </div>

          {estacion1Turno ? (
            <div className="pt-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Placa
                </span>
                <span className="text-2xl font-black font-mono tracking-widest text-[#042544]">
                  {getVehiculoById(estacion1Turno.idCliente, estacion1Turno.idVehiculo)?.placa || '---'}
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  {getServicioById(estacion1Turno.idServicio)?.nombre}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px]">Tiempo transcurrido</span>
                <span className="font-mono font-bold text-slate-800">
                  {getElapsedTime(estacion1Turno.fechaInicioLavado || estacion1Turno.fechaIngreso)}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Estación libre para recibir vehículo
            </div>
          )}
        </div>

        {/* Estación 2 */}
        <div
          className={`p-5 rounded-2xl border-2 transition-all bg-white shadow-xs ${
            estacion2Turno ? 'border-sky-300' : 'border-dashed border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#042544] text-[#3BBCFD] flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-extrabold text-[#042544] text-sm">Estación 2</h3>
            </div>
            {estacion2Turno ? (
              <EstadoBadge estado={estacion2Turno.estado} size="sm" />
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                DISPONIBLE
              </span>
            )}
          </div>

          {estacion2Turno ? (
            <div className="pt-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Placa
                </span>
                <span className="text-2xl font-black font-mono tracking-widest text-[#042544]">
                  {getVehiculoById(estacion2Turno.idCliente, estacion2Turno.idVehiculo)?.placa || '---'}
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  {getServicioById(estacion2Turno.idServicio)?.nombre}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px]">Tiempo transcurrido</span>
                <span className="font-mono font-bold text-slate-800">
                  {getElapsedTime(estacion2Turno.fechaInicioLavado || estacion2Turno.fechaIngreso)}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Estación libre para recibir vehículo
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Queue & Ready for Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next in Queue (FIFO) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-[#042544]">
                  Próximos turnos en cola FIFO ({turnosEnEspera.length})
                </h3>
              </div>
              <Link
                to="/turnos/cola"
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1"
              >
                <span>Ver cola completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {turnosEnEspera.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No hay vehículos en espera en este momento.
              </div>
            ) : (
              <div className="space-y-2.5">
                {turnosEnEspera.slice(0, 5).map((turno, idx) => {
                  const cliente = getClienteById(turno.idCliente);
                  const vehiculo = cliente ? getVehiculoById(turno.idCliente, turno.idVehiculo) : undefined;
                  const servicio = getServicioById(turno.idServicio);
                  const nombre = cliente?.razonSocial || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim();

                  return (
                    <div
                      key={turno.idTurno}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-mono font-black text-sm tracking-wider text-[#042544]">
                            {vehiculo?.placa || '---'}
                          </span>
                          <span className="text-slate-500 block text-[11px] truncate max-w-[180px]">
                            {nombre} · {servicio?.nombre}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-mono text-slate-600 block">
                          {formatTime(turno.fechaIngreso)}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(turno.precioServicio)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ready for Delivery */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-[#042544]">
                  Vehículos listos para retiro ({turnosListos.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Zona de parqueadero
              </span>
            </div>

            {turnosListos.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No hay vehículos esperando entrega actualmente.
              </div>
            ) : (
              <div className="space-y-2.5">
                {turnosListos.map(turno => {
                  const cliente = getClienteById(turno.idCliente);
                  const vehiculo = cliente ? getVehiculoById(turno.idCliente, turno.idVehiculo) : undefined;
                  const servicio = getServicioById(turno.idServicio);
                  const nombre = cliente?.razonSocial || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim();

                  return (
                    <div
                      key={turno.idTurno}
                      className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm tracking-wider text-[#042544]">
                            {vehiculo?.placa || '---'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            LISTO
                          </span>
                        </div>
                        <span className="text-slate-600 block text-[11px] truncate max-w-[200px]">
                          {nombre} · {servicio?.nombre}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTurnoToReprint(turno)}
                          title="Reimprimir comprobante"
                          className="p-1.5 text-slate-600 hover:text-[#042544] hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4 text-slate-500" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setTurnoToDeliver(turno.idTurno)}
                          className="py-1.5 px-3 rounded-lg bg-[#042544] hover:bg-[#073663] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-[#3BBCFD]" />
                          <span>Entregar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Deliver Vehicle */}
      <Modal
        isOpen={!!turnoToDeliver}
        onClose={() => setTurnoToDeliver(null)}
        title="Confirmar Entrega de Vehículo"
        description="Esta acción marca el turno como entregado y cierra el ciclo de atención."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            ¿Confirmas que el cliente ha verificado su vehículo y se ha completado el retiro en el parqueadero?
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTurnoToDeliver(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDelivering}
              onClick={handleConfirmDeliver}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {isDelivering ? 'Entregando...' : 'Sí, confirmar entrega'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Standalone Reprint Modal */}
      {turnoToReprint && (
        <Modal
          isOpen={true}
          onClose={() => setTurnoToReprint(null)}
          title={`Reimprimir Comprobante · Turno #${turnoToReprint.idTurno}`}
          description="Reimpresión de ticket sin duplicar turnos."
          maxWidth="md"
        >
          <div className="flex flex-col items-center">
            <PrintableReceipt turno={turnoToReprint} showPrintButton={true} />
            <button
              type="button"
              onClick={() => setTurnoToReprint(null)}
              className="mt-4 px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cerrar vista
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
