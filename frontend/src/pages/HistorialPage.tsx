/**
 * HistorialPage: Finished & Cancelled Turns History
 * Conforms to Spec Section 16
 */
import React, { useState, useMemo } from 'react';
import { useCarWash } from '../context/CarWashContext';
import { EstadoTurno, TipoLavado, TurnoCarwash } from '../types';
import { EstadoBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PrintableReceipt } from '../components/common/PrintableReceipt';
import { formatCurrency, formatDateTime, TIPO_DOCUMENTO_LABELS } from '../utils/formatters';
import { Search, History, Printer, Filter, X, Eye } from 'lucide-react';

export const HistorialPage: React.FC = () => {
  const {
    turnosHistorial,
    servicios,
    getClienteById,
    getVehiculoById,
    getServicioById
  } = useCarWash();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoTurno | 'TODOS'>('TODOS');
  const [filterServicio, setFilterServicio] = useState<number | 'TODOS'>('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [inspectedTurno, setInspectedTurno] = useState<TurnoCarwash | null>(null);
  const [turnoToPrint, setTurnoToPrint] = useState<TurnoCarwash | null>(null);

  const filteredHistory = useMemo(() => {
    return turnosHistorial.filter(t => {
      const cliente = getClienteById(t.idCliente);
      const vehiculo = cliente ? getVehiculoById(t.idCliente, t.idVehiculo) : undefined;

      // Status filter
      if (filterEstado !== 'TODOS' && t.estado !== filterEstado) return false;

      // Service filter
      if (filterServicio !== 'TODOS' && t.idServicio !== filterServicio) return false;

      // Dates
      if (fechaDesde && new Date(t.fechaIngreso) < new Date(fechaDesde)) return false;
      if (fechaHasta) {
        const hastaEnd = new Date(fechaHasta);
        hastaEnd.setHours(23, 59, 59, 999);
        if (new Date(t.fechaIngreso) > hastaEnd) return false;
      }

      // Search term (plate or customer document or customer name)
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchesPlate = vehiculo?.placa.toLowerCase().includes(term);
        const matchesDoc = cliente?.numeroDocumento.toLowerCase().includes(term);
        const matchesName = (cliente?.razonSocial || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`).toLowerCase().includes(term);

        if (!matchesPlate && !matchesDoc && !matchesName) return false;
      }

      return true;
    });
  }, [turnosHistorial, filterEstado, filterServicio, fechaDesde, fechaHasta, searchTerm, getClienteById, getVehiculoById]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterEstado('TODOS');
    setFilterServicio('TODOS');
    setFechaDesde('');
    setFechaHasta('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#042544]">
          Historial de Turnos
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Consulta y auditoría de vehículos entregados y cancelaciones operativas con precios históricos.
        </p>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Term */}
          <div className="lg:col-span-2 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Búsqueda rápida
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Placa, documento o nombre del cliente..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3BBCFD]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Estado
            </label>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value as EstadoTurno | 'TODOS')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-[#3BBCFD]"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ENTREGADO">Entregados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Servicio
            </label>
            <select
              value={filterServicio}
              onChange={e => setFilterServicio(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-[#3BBCFD]"
            >
              <option value="TODOS">Todos los servicios</option>
              {servicios.map(s => (
                <option key={s.idServicio} value={s.idServicio}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        </div>

        {/* Date range row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Filtrar por fecha:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No encontramos registros históricos</p>
            <p className="text-xs text-slate-500 mt-1">Prueba cambiando o limpiando los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Turno</th>
                  <th className="py-3 px-4">Fecha ingreso</th>
                  <th className="py-3 px-4">Placa</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Servicio</th>
                  <th className="py-3 px-4 text-right">Precio Histórico</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map(turno => {
                  const cliente = getClienteById(turno.idCliente);
                  const vehiculo = cliente ? getVehiculoById(turno.idCliente, turno.idVehiculo) : undefined;
                  const servicio = getServicioById(turno.idServicio);
                  const nombre = cliente?.razonSocial || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim();

                  return (
                    <tr key={turno.idTurno} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{turno.idTurno}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateTime(turno.fechaIngreso)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-sm tracking-wider text-[#042544]">
                          {vehiculo?.placa || '---'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 truncate max-w-[180px] block">
                          {nombre}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {cliente?.numeroDocumento}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        {servicio?.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(turno.precioServicio)}
                      </td>
                      <td className="py-3.5 px-4">
                        <EstadoBadge estado={turno.estado} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => setInspectedTurno(turno)}
                          title="Inspeccionar detalle del turno"
                          className="p-1.5 text-slate-600 hover:text-[#042544] hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ver</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTurnoToPrint(turno)}
                          title="Reimprimir comprobante"
                          className="p-1.5 text-slate-600 hover:text-[#042544] hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#3BBCFD]" />
                          <span>Ticket</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Turn Modal */}
      {inspectedTurno && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedTurno(null)}
          title={`Detalle de Turno #${inspectedTurno.idTurno}`}
          description={`Generado el ${formatDateTime(inspectedTurno.fechaIngreso)}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Estado final:</span>
              <EstadoBadge estado={inspectedTurno.estado} />
            </div>

            <div className="space-y-2 p-3 bg-white border border-slate-200 rounded-xl">
              <div className="flex justify-between">
                <span className="text-slate-500">Precio facturado:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(inspectedTurno.precioServicio)}
                </span>
              </div>
              {inspectedTurno.fechaFinalizacion && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Finalización de lavado:</span>
                  <span className="font-mono">{formatDateTime(inspectedTurno.fechaFinalizacion)}</span>
                </div>
              )}
              {inspectedTurno.fechaEntrega && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de entrega:</span>
                  <span className="font-mono">{formatDateTime(inspectedTurno.fechaEntrega)}</span>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div>
              <span className="font-bold text-slate-700 block mb-2">Trazabilidad de estados:</span>
              <div className="space-y-1.5">
                {inspectedTurno.historialEstados.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] p-2 bg-slate-50 rounded-lg">
                    <span className="font-semibold text-slate-700">{h.estado}</span>
                    <span className="font-mono text-slate-500">{formatDateTime(h.fecha)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const t = inspectedTurno;
                  setInspectedTurno(null);
                  setTurnoToPrint(t);
                }}
                className="px-4 py-2 bg-[#042544] text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-[#3BBCFD]" />
                <span>Reimprimir comprobante</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Standalone Ticket Reprint Modal */}
      {turnoToPrint && (
        <Modal
          isOpen={true}
          onClose={() => setTurnoToPrint(null)}
          title={`Reimpresión de Comprobante · Turno #${turnoToPrint.idTurno}`}
          description="Ticket térmico 80mm."
          maxWidth="md"
        >
          <div className="flex flex-col items-center">
            <PrintableReceipt turno={turnoToPrint} showPrintButton={true} />
            <button
              type="button"
              onClick={() => setTurnoToPrint(null)}
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
