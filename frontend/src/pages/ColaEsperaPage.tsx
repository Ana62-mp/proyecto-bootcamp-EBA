/**
 * ColaEsperaPage: FIFO Waiting Queue
 * Conforms to Spec Section 10:
 * - Public/Kiosk privacy safe (never exposes customer names, phone, email, doc in MAQUINA role)
 * - Internal staff view shows customer name and creation timestamp
 * - Plate search filter
 * - Admin cancellation with modal confirmation and dispatcher re-run
 */
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCarWash } from '../context/CarWashContext';
import { EstadoBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatTime } from '../utils/formatters';
import { Search, Clock, AlertTriangle, XCircle, X } from 'lucide-react';

export const ColaEsperaPage: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    turnosEnEspera,
    cancelarTurno,
    getClienteById,
    getVehiculoById,
    getServicioById
  } = useCarWash();

  const [searchTerm, setSearchTerm] = useState('');
  const [turnoToCancel, setTurnoToCancel] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const isMaquina = currentUser?.rol === 'MAQUINA';
  const isAdmin = currentUser?.rol === 'ADMIN';

  // Filter queue by plate search
  const filteredQueue = useMemo(() => {
    const term = searchTerm.trim().toUpperCase();
    if (!term) return turnosEnEspera;

    return turnosEnEspera.filter(t => {
      const vehiculo = getVehiculoById(t.idCliente, t.idVehiculo);
      return vehiculo?.placa.includes(term);
    });
  }, [turnosEnEspera, searchTerm, getVehiculoById]);

  const handleConfirmCancel = async () => {
    if (!turnoToCancel) return;
    setIsCanceling(true);
    try {
      await cancelarTurno(turnoToCancel);
      setTurnoToCancel(null);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#042544]">
            Cola de Espera (FIFO)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Turnos organizados en orden estricto de llegada para asignación automática a estaciones.
          </p>
        </div>

        {/* Search Input for Plates */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value.toUpperCase())}
            placeholder="Buscar por placa..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#3BBCFD]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-2.5 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Queue Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredQueue.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">
              {searchTerm ? 'No encontramos turnos con esa placa' : 'No hay vehículos en la cola de espera'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm
                ? 'Verifica los caracteres ingresados de la placa.'
                : 'En cuanto un cliente registre su turno, aparecerá aquí en estricto orden de llegada.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-16 text-center">#</th>
                  <th className="py-3 px-4">Placa</th>
                  <th className="py-3 px-4">Servicio</th>
                  {/* Personal data only shown to internal staff (Admin/Lavador), never to MAQUINA */}
                  {!isMaquina && (
                    <>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Hora llegada</th>
                    </>
                  )}
                  <th className="py-3 px-4 text-right">Precio</th>
                  <th className="py-3 px-4">Estado</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredQueue.map((turno, index) => {
                  const cliente = getClienteById(turno.idCliente);
                  const vehiculo = getVehiculoById(turno.idCliente, turno.idVehiculo);
                  const servicio = getServicioById(turno.idServicio);
                  const nombre = cliente?.razonSocial || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim();

                  return (
                    <tr key={turno.idTurno} className="hover:bg-slate-50/70 transition-colors">
                      {/* Queue position badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold inline-flex items-center justify-center font-mono text-xs">
                          {index + 1}
                        </span>
                      </td>

                      {/* Plate */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-base tracking-widest text-[#042544] block">
                          {vehiculo?.placa || 'ABC-1234'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {vehiculo?.marca} {vehiculo?.modelo}
                        </span>
                      </td>

                      {/* Service */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {servicio?.nombre}
                      </td>

                      {/* Customer & Time for Internal Staff */}
                      {!isMaquina && (
                        <>
                          <td className="py-3.5 px-4 text-slate-700">
                            <span className="font-medium truncate max-w-[180px] block">{nombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Doc: {cliente?.numeroDocumento}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {formatTime(turno.fechaIngreso)}
                          </td>
                        </>
                      )}

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(turno.precioServicio)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <EstadoBadge estado={turno.estado} size="sm" />
                      </td>

                      {/* Admin Cancel Action */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setTurnoToCancel(turno.idTurno)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancelar</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Cancellation Confirmation Modal */}
      <Modal
        isOpen={!!turnoToCancel}
        onClose={() => setTurnoToCancel(null)}
        title="Cancelar Turno en Espera"
        description="Esta acción retirará el turno de la cola FIFO y reasignará las posiciones."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              ¿Estás seguro de que deseas cancelar este turno? Esta acción quedará registrada en el historial.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTurnoToCancel(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={isCanceling}
              onClick={handleConfirmCancel}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {isCanceling ? 'Cancelando...' : 'Sí, cancelar turno'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
