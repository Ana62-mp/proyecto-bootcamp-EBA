/**
 * ClientesPage: Administrative Customer CRUD
 * Conforms to Spec Section 17
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cliente, PaginatedResult, TipoDocumento } from '../types';
import { ClientesService, ClienteFilters } from '../services/clientesService';
import { useCarWash } from '../context/CarWashContext';
import { Pagination } from '../components/common/Pagination';
import { ClientModal } from '../components/admin/ClientModal';
import { ClientDetailModal } from '../components/admin/ClientDetailModal';
import { Modal } from '../components/common/Modal';
import { formatDateTime, TIPO_DOCUMENTO_LABELS } from '../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Car,
  AlertTriangle
} from 'lucide-react';

export const ClientesPage: React.FC = () => {
  const { refreshData, showToast } = useCarWash();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento | 'TODOS'>('TODOS');
  const [estadoActivo, setEstadoActivo] = useState<boolean | 'TODOS'>('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginatedData, setPaginatedData] = useState<PaginatedResult<Cliente>>({
    items: [],
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [inspectedCliente, setInspectedCliente] = useState<Cliente | null>(null);
  const [clientToToggle, setClientToToggle] = useState<Cliente | null>(null);
  const [toggleError, setToggleError] = useState('');

  // Debounce search input by 300ms per Spec Section 17.5
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Return to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const filters: ClienteFilters = {
      searchTerm: debouncedSearch,
      tipoDocumento,
      activo: estadoActivo,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined
    };

    try {
      const result = await ClientesService.listarPaginado(filters, page, pageSize);
      setPaginatedData(result);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, tipoDocumento, estadoActivo, fechaDesde, fechaHasta, page, pageSize]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setTipoDocumento('TODOS');
    setEstadoActivo('TODOS');
    setFechaDesde('');
    setFechaHasta('');
    setPage(1);
  };

  const handleSaveCliente = async (clienteData: any) => {
    const displayName = clienteData.razonSocial || `${clienteData.nombres || ''} ${clienteData.apellidos || ''}`.trim() || 'Cliente';
    if (editingCliente) {
      await ClientesService.actualizarCliente(editingCliente.idCliente, clienteData);
      showToast(`Cliente "${displayName}" actualizado correctamente.`, 'success');
    } else {
      await ClientesService.crearCliente(clienteData);
      showToast(`Cliente "${displayName}" registrado exitosamente.`, 'success');
    }
    refreshData();
    await loadClients();
  };

  const handleConfirmToggleActive = async () => {
    if (!clientToToggle) return;
    setToggleError('');
    try {
      const displayName = clientToToggle.razonSocial || `${clientToToggle.nombres || ''} ${clientToToggle.apellidos || ''}`.trim();
      const willBeActive = !clientToToggle.activo;
      await ClientesService.cambiarEstadoActivo(clientToToggle.idCliente, willBeActive);
      showToast(
        `Cliente "${displayName}" ${willBeActive ? 'reactivado' : 'desactivado'} con éxito.`,
        willBeActive ? 'success' : 'info'
      );
      setClientToToggle(null);
      refreshData();
      await loadClients();
    } catch (err: unknown) {
      setToggleError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#042544]">
            Gestión de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de clientes, flotas, vehículos asociados y registros oficiales.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCliente(null);
            setIsCreateModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-[#042544] hover:bg-[#073663] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#3BBCFD]" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Term with 300ms debounce */}
          <div className="lg:col-span-2 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Búsqueda (documento, nombre, teléfono, placa)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Escribe para buscar..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3BBCFD]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Tipo de Documento */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Tipo de documento
            </label>
            <select
              value={tipoDocumento}
              onChange={e => {
                setTipoDocumento(e.target.value as TipoDocumento | 'TODOS');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-[#3BBCFD]"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="CEDULA">Cédula</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="RUC">RUC</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Estado
            </label>
            <select
              value={estadoActivo === 'TODOS' ? 'TODOS' : estadoActivo ? 'ACTIVO' : 'INACTIVO'}
              onChange={e => {
                const val = e.target.value;
                setEstadoActivo(val === 'TODOS' ? 'TODOS' : val === 'ACTIVO');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-[#3BBCFD]"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Solo Activos</option>
              <option value="INACTIVO">Solo Inactivos</option>
            </select>
          </div>

          {/* Reset button */}
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

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Fecha de registro:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => {
                setFechaDesde(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => {
                setFechaHasta(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {paginatedData.items.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">
              {searchTerm || tipoDocumento !== 'TODOS' || estadoActivo !== 'TODOS'
                ? 'No encontramos resultados con los filtros seleccionados'
                : 'No hay clientes registrados'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Prueba modificando tus términos de búsqueda o registra un nuevo cliente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Doc / Tipo</th>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Cliente / Razón Social</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Vehículos</th>
                  <th className="py-3 px-4">Registro</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.items.map(cliente => {
                  const nombre = cliente.razonSocial || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
                  const activeVehicles = cliente.vehiculos.filter(v => v.activo);

                  return (
                    <tr key={cliente.idCliente} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {TIPO_DOCUMENTO_LABELS[cliente.tipoDocumento]}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {cliente.numeroDocumento}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block truncate max-w-[200px]">
                          {nombre}
                        </span>
                        {cliente.correo && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                            {cliente.correo}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {cliente.telefono}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold font-mono text-[10px] flex items-center justify-center">
                            {activeVehicles.length}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono truncate max-w-[120px]">
                            {activeVehicles.map(v => v.placa).join(', ') || 'Sin autos'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(cliente.fechaRegistro)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            cliente.activo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectedCliente(cliente)}
                          title="Inspeccionar cliente"
                          className="p-1.5 text-slate-600 hover:text-[#042544] hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ver</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingCliente(cliente);
                            setIsCreateModalOpen(true);
                          }}
                          title="Editar cliente"
                          className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#3BBCFD]" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setToggleError('');
                            setClientToToggle(cliente);
                          }}
                          title={cliente.activo ? 'Desactivar cliente' : 'Reactivar cliente'}
                          className={`p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold ${
                            cliente.activo
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {cliente.activo ? <Trash2 className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          <span>{cliente.activo ? 'Desactivar' : 'Reactivar'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <Pagination
          currentPage={paginatedData.page}
          pageSize={paginatedData.pageSize}
          totalItems={paginatedData.totalItems}
          totalPages={paginatedData.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="clientes"
        />
      </div>

      {/* Create / Edit Modal */}
      <ClientModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCliente(null);
        }}
        clienteToEdit={editingCliente}
        onSave={handleSaveCliente}
      />

      {/* Inspect Detail Modal */}
      <ClientDetailModal
        isOpen={!!inspectedCliente}
        onClose={() => setInspectedCliente(null)}
        cliente={inspectedCliente}
      />

      {/* Logical Deactivation Confirmation Modal */}
      <Modal
        isOpen={!!clientToToggle}
        onClose={() => setClientToToggle(null)}
        title={clientToToggle?.activo ? 'Desactivar Cliente' : 'Reactivar Cliente'}
        description="El cambio de estado afectará el acceso a nuevos turnos."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {toggleError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{toggleError}</span>
            </div>
          )}

          <p className="text-slate-600">
            {clientToToggle?.activo
              ? `¿Deseas desactivar al cliente "${clientToToggle.razonSocial || clientToToggle.nombres}"? El historial de turnos se conservará intacto.`
              : `¿Deseas reactivar al cliente "${clientToToggle?.razonSocial || clientToToggle?.nombres}" para que pueda volver a solicitar turnos?`}
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setClientToToggle(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmToggleActive}
              className={`px-5 py-2 rounded-lg text-white text-xs font-bold shadow-sm ${
                clientToToggle?.activo
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {clientToToggle?.activo ? 'Sí, desactivar' : 'Sí, reactivar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
