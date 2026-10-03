/**
 * UsuariosPage: Administrative User Management
 * Conforms to Spec Section 18:
 * - Single admin rule: no duplicate admin, cannot demote/delete admin
 * - Creates KIOSK (Máquina) and Lavador
 * - Filters, pagination, reset password modal
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PaginatedResult, Rol, Usuario } from '../types';
import { UsuariosService, UsuarioFilters } from '../services/usuariosService';
import { useCarWash } from '../context/CarWashContext';
import { Pagination } from '../components/common/Pagination';
import { UserModal } from '../components/admin/UserModal';
import { Modal } from '../components/common/Modal';
import { ROL_LABELS } from '../utils/formatters';
import {
  UserCheck,
  UserPlus,
  Search,
  Shield,
  Monitor,
  KeyRound,
  Edit,
  Trash2,
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react';

export const UsuariosPage: React.FC = () => {
  const { refreshData, showToast } = useCarWash();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFilter, setRolFilter] = useState<Rol | 'TODOS'>('TODOS');
  const [estadoFilter, setEstadoFilter] = useState<boolean | 'TODOS'>('TODOS');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginatedData, setPaginatedData] = useState<PaginatedResult<Usuario>>({
    items: [],
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userToToggle, setUserToToggle] = useState<Usuario | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<Usuario | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [toggleError, setToggleError] = useState('');

  const loadUsers = useCallback(async () => {
    const filters: UsuarioFilters = {
      searchTerm: searchTerm.trim(),
      rol: rolFilter,
      activo: estadoFilter
    };
    const result = await UsuariosService.listarPaginado(filters, page, pageSize);
    setPaginatedData(result);
  }, [searchTerm, rolFilter, estadoFilter, page, pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSaveUser = async (data: any) => {
    if (editingUser) {
      await UsuariosService.actualizarUsuario(editingUser.idUsuario, data);
      showToast(`Usuario "${data.usuario}" actualizado exitosamente.`, 'success');
    } else {
      await UsuariosService.crearUsuario(data);
      showToast(`Usuario "${data.usuario}" creado exitosamente.`, 'success');
    }
    refreshData();
    await loadUsers();
  };

  const handleConfirmToggle = async () => {
    if (!userToToggle) return;
    setToggleError('');
    try {
      const willBeActive = !userToToggle.activo;
      await UsuariosService.cambiarEstadoActivo(userToToggle.idUsuario, willBeActive);
      showToast(
        `Usuario "${userToToggle.usuario}" ${willBeActive ? 'reactivado' : 'desactivado'} con éxito.`,
        willBeActive ? 'success' : 'info'
      );
      setUserToToggle(null);
      refreshData();
      await loadUsers();
    } catch (err: unknown) {
      setToggleError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!userToResetPassword) return;
    if (!newTempPassword || newTempPassword.length < 6) {
      setResetError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    setResetError('');
    const userTarget = userToResetPassword.usuario;
    await UsuariosService.restablecerPassword(userToResetPassword.idUsuario, newTempPassword);
    setUserToResetPassword(null);
    setNewTempPassword('');
    showToast(`Contraseña temporal de "${userTarget}" restablecida con éxito.`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#042544]">
            Gestión de Usuarios y Terminales
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra máquinas autoservicio, operadores de lavado y credenciales del sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setIsCreateModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-[#042544] hover:bg-[#073663] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#3BBCFD]" />
          <span>Nuevo usuario o máquina</span>
        </button>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Search Term */}
          <div className="sm:col-span-2 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Búsqueda (usuario, nombre, código, ubicación)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por usuario o código..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3BBCFD]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Rol Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Rol
            </label>
            <select
              value={rolFilter}
              onChange={e => {
                setRolFilter(e.target.value as Rol | 'TODOS');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-[#3BBCFD]"
            >
              <option value="TODOS">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="MAQUINA">Máquina Autoservicio</option>
              <option value="LAVADOR">Operador Lavador</option>
            </select>
          </div>

          {/* Estado Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Estado
            </label>
            <select
              value={estadoFilter === 'TODOS' ? 'TODOS' : estadoFilter ? 'ACTIVO' : 'INACTIVO'}
              onChange={e => {
                const val = e.target.value;
                setEstadoFilter(val === 'TODOS' ? 'TODOS' : val === 'ACTIVO');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-[#3BBCFD]"
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {paginatedData.items.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No hay usuarios con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Nombre / Descripción</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Código / Identificador</th>
                  <th className="py-3 px-4">Ubicación / Estación</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.items.map(u => {
                  const isAdmin = u.rol === 'ADMIN';

                  return (
                    <tr key={u.idUsuario} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {u.usuario}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {u.nombreVisible}
                        {isAdmin && (
                          <span className="ml-2 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Principal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            u.rol === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.rol === 'MAQUINA'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {ROL_LABELS[u.rol]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {u.codigo || '---'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {u.ubicacion || (u.estacionPreferida ? `Estación ${u.estacionPreferida}` : '---')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            u.activo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setIsCreateModalOpen(true);
                          }}
                          title="Editar usuario"
                          className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#3BBCFD]" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserToResetPassword(u);
                            setNewTempPassword('');
                            setResetError('');
                          }}
                          title="Restablecer contraseña temporal"
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                          <span>Clave</span>
                        </button>

                        {/* Admin cannot be deactivated or deleted per spec */}
                        {!isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setToggleError('');
                              setUserToToggle(u);
                            }}
                            title={u.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                            className={`p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold ${
                              u.activo
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.activo ? <Trash2 className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            <span>{u.activo ? 'Desactivar' : 'Reactivar'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={paginatedData.page}
          pageSize={paginatedData.pageSize}
          totalItems={paginatedData.totalItems}
          totalPages={paginatedData.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="usuarios"
        />
      </div>

      {/* Create / Edit User Modal */}
      <UserModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingUser(null);
        }}
        userToEdit={editingUser}
        onSave={handleSaveUser}
      />

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!userToResetPassword}
        onClose={() => setUserToResetPassword(null)}
        title={`Restablecer Contraseña · ${userToResetPassword?.usuario}`}
        description="Ingresa una nueva contraseña temporal para este usuario."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          {resetError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {resetError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nueva Contraseña Temporal *
            </label>
            <input
              type="password"
              autoFocus
              value={newTempPassword}
              onChange={e => setNewTempPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-[#3BBCFD]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUserToResetPassword(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmResetPassword}
              className="px-5 py-2 rounded-lg bg-[#042544] text-white text-xs font-bold shadow-sm"
            >
              Actualizar contraseña
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate User Modal */}
      <Modal
        isOpen={!!userToToggle}
        onClose={() => setUserToToggle(null)}
        title={userToToggle?.activo ? 'Desactivar Usuario' : 'Reactivar Usuario'}
        description="Acción de administración de usuarios."
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
            {userToToggle?.activo
              ? `¿Deseas desactivar al usuario "${userToToggle.usuario}"? No podrá iniciar sesión hasta ser reactivado.`
              : `¿Deseas reactivar al usuario "${userToToggle?.usuario}"?`}
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUserToToggle(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmToggle}
              className={`px-5 py-2 rounded-lg text-white text-xs font-bold shadow-sm ${
                userToToggle?.activo
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {userToToggle?.activo ? 'Sí, desactivar' : 'Sí, reactivar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
