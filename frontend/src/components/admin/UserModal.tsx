/**
 * UserModal: Create and Edit Users
 * Enforces:
 * - Single admin rule: no admin creation, no admin role modification.
 * - Specialized fields for Máquina and Lavador.
 * - Temporary password creation and confirmation.
 */
import React, { useState, useEffect } from 'react';
import { Rol, Usuario } from '../../types';
import { Modal } from '../common/Modal';
import { ShieldAlert, Monitor, UserCheck } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: Usuario | null;
  onSave: (data: any) => Promise<void>;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSave
}) => {
  const isEditing = !!userToEdit;
  const isEditingAdmin = userToEdit?.rol === 'ADMIN';

  const [rol, setRol] = useState<'MAQUINA' | 'LAVADOR'>('MAQUINA');
  const [usuario, setUsuario] = useState('');
  const [nombreVisible, setNombreVisible] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [estacionPreferida, setEstacionPreferida] = useState<1 | 2 | ''>('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setRol(userToEdit.rol === 'ADMIN' ? 'MAQUINA' : userToEdit.rol);
      setUsuario(userToEdit.usuario);
      setNombreVisible(userToEdit.nombreVisible);
      setCodigo(userToEdit.codigo || '');
      setUbicacion(userToEdit.ubicacion || '');
      setEstacionPreferida(userToEdit.estacionPreferida || '');
      setPassword('');
      setConfirmPassword('');
    } else {
      setRol('MAQUINA');
      setUsuario('');
      setNombreVisible('');
      setCodigo('');
      setUbicacion('');
      setEstacionPreferida('');
      setPassword('');
      setConfirmPassword('');
    }
    setErrors({});
  }, [userToEdit, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!usuario.trim()) {
      errs.usuario = 'El nombre de usuario es obligatorio';
    } else if (!/^[a-z0-9_.-]+$/i.test(usuario.trim())) {
      errs.usuario = 'Solo letras, números, puntos y guiones sin espacios';
    }

    if (!nombreVisible.trim()) {
      errs.nombreVisible = 'El nombre visible es obligatorio';
    }

    if (!isEditing) {
      if (!password) {
        errs.password = 'La contraseña temporal es obligatoria';
      } else if (password.length < 6) {
        errs.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (password !== confirmPassword) {
        errs.confirmPassword = 'Las contraseñas no coinciden';
      }
    } else if (password) {
      if (password.length < 6) {
        errs.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (password !== confirmPassword) {
        errs.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await onSave({
          idUsuario: userToEdit.idUsuario,
          usuario: usuario.trim().toLowerCase(),
          nombreVisible: nombreVisible.trim(),
          codigo: codigo.trim() || undefined,
          ubicacion: rol === 'MAQUINA' ? ubicacion.trim() || undefined : undefined,
          estacionPreferida: rol === 'LAVADOR' && estacionPreferida ? estacionPreferida : null,
          passwordTemporal: password || undefined
        });
      } else {
        await onSave({
          rol,
          usuario: usuario.trim().toLowerCase(),
          nombreVisible: nombreVisible.trim(),
          codigo: codigo.trim() || undefined,
          ubicacion: rol === 'MAQUINA' ? ubicacion.trim() || undefined : undefined,
          estacionPreferida: rol === 'LAVADOR' && estacionPreferida ? estacionPreferida : null,
          passwordTemporal: password
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar usuario';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Usuario (${userToEdit.rol})` : 'Registrar Nuevo Usuario'}
      description="Configura permisos y accesos operativos del sistema."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errors.form}
          </div>
        )}

        {/* Role Selection (Only when creating) */}
        {!isEditing ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Tipo de Usuario *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRol('MAQUINA')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  rol === 'MAQUINA'
                    ? 'bg-[#042544] text-white border-[#042544] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Monitor className="w-5 h-5 text-[#3BBCFD]" />
                <span>Máquina Autoservicio</span>
                <span className="text-[10px] font-normal opacity-80">
                  Acceso solo a Nuevo Turno y Cola
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRol('LAVADOR')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  rol === 'LAVADOR'
                    ? 'bg-[#042544] text-white border-[#042544] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-5 h-5 text-[#3BBCFD]" />
                <span>Operador Lavador</span>
                <span className="text-[10px] font-normal opacity-80">
                  Gestión de etapas en estaciones
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              Nota del sistema: Solo puede existir un Administrador Principal.
            </p>
          </div>
        ) : isEditingAdmin ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Este es el <strong>Administrador Principal</strong>. Su rol y privilegios no pueden ser modificados.
            </span>
          </div>
        ) : null}

        {/* Username & Visible Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="usuario" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nombre de usuario *
            </label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              placeholder="ej: kiosk03, lavador_luis"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-[#3BBCFD]"
            />
            {errors.usuario && <p className="text-xs text-rose-600 mt-1">{errors.usuario}</p>}
          </div>

          <div>
            <label htmlFor="nombreVisible" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nombre visible *
            </label>
            <input
              id="nombreVisible"
              type="text"
              value={nombreVisible}
              onChange={e => setNombreVisible(e.target.value)}
              placeholder="ej: Kiosko Entrada 3, Luis Paredes"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#3BBCFD]"
            />
            {errors.nombreVisible && (
              <p className="text-xs text-rose-600 mt-1">{errors.nombreVisible}</p>
            )}
          </div>
        </div>

        {/* Role-specific fields */}
        {rol === 'MAQUINA' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="codigo" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Código de Terminal
              </label>
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="ej: KIOSK-03"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase focus:ring-1 focus:ring-[#3BBCFD]"
              />
            </div>

            <div>
              <label htmlFor="ubicacion" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Ubicación física
              </label>
              <input
                id="ubicacion"
                type="text"
                value={ubicacion}
                onChange={e => setUbicacion(e.target.value)}
                placeholder="ej: Entrada Principal, Bahía 3"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#3BBCFD]"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="codigo" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Identificador / Cédula
              </label>
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="ej: LAV-03 o 1712345678"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-[#3BBCFD]"
              />
            </div>

            <div>
              <label htmlFor="estacionPreferida" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Estación Preferida
              </label>
              <select
                id="estacionPreferida"
                value={estacionPreferida}
                onChange={e => setEstacionPreferida(e.target.value ? (Number(e.target.value) as 1 | 2) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-[#3BBCFD]"
              >
                <option value="">Sin preferencia fija</option>
                <option value="1">Estación 1</option>
                <option value="2">Estación 2</option>
              </select>
            </div>
          </div>
        )}

        {/* Temporary Password */}
        <div className="pt-2 border-t border-slate-200">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            {isEditing ? 'Cambiar Contraseña Temporal (opcional)' : 'Contraseña Temporal *'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEditing ? 'Dejar en blanco para mantener' : 'Mínimo 6 caracteres'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-[#3BBCFD]"
              />
              {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-[#3BBCFD]"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-rose-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-[#042544] hover:bg-[#073663] text-white text-xs font-bold shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
