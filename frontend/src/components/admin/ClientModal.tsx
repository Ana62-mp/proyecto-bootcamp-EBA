/**
 * ClientModal: Create and Edit Client
 * Features:
 * - Document locked in edit mode with explicit unlock confirmation
 * - Inline vehicle management
 * - Validation of duplicates
 */
import React, { useState, useEffect } from 'react';
import { Cliente, TipoDocumento, TipoVehiculo, Vehiculo } from '../../types';
import { Modal } from '../common/Modal';
import {
  validarDocumento,
  normalizarYValidarPlaca,
  validarCorreo,
  validarCelular,
  formatearPlacaEnTiempoReal
} from '../../utils/documentValidators';
import { Plus, Trash2, Lock, Unlock, Car } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteToEdit: Cliente | null;
  onSave: (data: any) => Promise<void>;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  clienteToEdit,
  onSave
}) => {
  const isEditing = !!clienteToEdit;

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CEDULA');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [isDocUnlocked, setIsDocUnlocked] = useState(false);

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');

  // Vehicles list for creation or editing
  const [vehiculos, setVehiculos] = useState<Array<{
    idVehiculo?: number;
    placa: string;
    marca: string;
    modelo: string;
    color: string;
    tipoVehiculo: TipoVehiculo;
    activo: boolean;
  }>>([]);

  // New vehicle form inputs
  const [newPlaca, setNewPlaca] = useState('');
  const [newMarca, setNewMarca] = useState('');
  const [newModelo, setNewModelo] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newTipo, setNewTipo] = useState<TipoVehiculo>('AUTOMOVIL');
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clienteToEdit) {
      setTipoDocumento(clienteToEdit.tipoDocumento);
      setNumeroDocumento(clienteToEdit.numeroDocumento);
      setNombres(clienteToEdit.nombres || '');
      setApellidos(clienteToEdit.apellidos || '');
      setRazonSocial(clienteToEdit.razonSocial || '');
      setNombreContacto(clienteToEdit.nombreContacto || '');
      setTelefono(clienteToEdit.telefono || '');
      setCorreo(clienteToEdit.correo || '');
      setVehiculos(clienteToEdit.vehiculos || []);
      setIsDocUnlocked(false);
    } else {
      setTipoDocumento('CEDULA');
      setNumeroDocumento('');
      setNombres('');
      setApellidos('');
      setRazonSocial('');
      setNombreContacto('');
      setTelefono('');
      setCorreo('');
      setVehiculos([]);
      setIsDocUnlocked(true);
    }
    setErrors({});
    setShowVehicleForm(false);
  }, [clienteToEdit, isOpen]);

  const handleAddVehicle = () => {
    setErrors(prev => ({ ...prev, vehicle: '' }));
    const val = normalizarYValidarPlaca(newPlaca);
    if (!val.isValid) {
      setErrors(prev => ({ ...prev, vehicle: val.errorMessage || 'Placa inválida' }));
      return;
    }

    if (vehiculos.some(v => v.placa === val.cleanedValue && v.activo)) {
      setErrors(prev => ({ ...prev, vehicle: 'Esta placa ya está agregada a la lista' }));
      return;
    }

    if (!newMarca.trim() || !newModelo.trim() || !newColor.trim()) {
      setErrors(prev => ({ ...prev, vehicle: 'Marca, modelo y color son obligatorios' }));
      return;
    }

    setVehiculos(prev => [
      ...prev,
      {
        placa: val.cleanedValue,
        marca: newMarca.trim(),
        modelo: newModelo.trim(),
        color: newColor.trim(),
        tipoVehiculo: newTipo,
        activo: true
      }
    ]);

    setNewPlaca('');
    setNewMarca('');
    setNewModelo('');
    setNewColor('');
    setShowVehicleForm(false);
  };

  const handleToggleVehicleActive = (index: number) => {
    setVehiculos(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], activo: !copy[index].activo };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    // Validate doc if creating or unlocked
    if (!isEditing || isDocUnlocked) {
      const docVal = validarDocumento(tipoDocumento, numeroDocumento);
      if (!docVal.isValid) {
        errs.documento = docVal.errorMessage || 'Documento inválido';
      }
    }

    if (tipoDocumento === 'RUC') {
      if (!razonSocial.trim()) errs.razonSocial = 'La razón social es obligatoria';
    } else {
      if (!nombres.trim()) errs.nombres = 'Los nombres son obligatorios';
      if (!apellidos.trim()) errs.apellidos = 'Los apellidos son obligatorios';
    }

    const phoneVal = validarCelular(telefono);
    if (!phoneVal.isValid) {
      errs.telefono = phoneVal.errorMessage || 'El teléfono es obligatorio y debe contener solo números';
    }

    if (correo.trim()) {
      const emailVal = validarCorreo(correo);
      if (!emailVal.isValid) {
        errs.correo = emailVal.errorMessage || 'El correo debe tener formato válido con @ y .';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        tipoDocumento,
        numeroDocumento: numeroDocumento.trim(),
        nombres: tipoDocumento === 'RUC' ? null : nombres.trim(),
        apellidos: tipoDocumento === 'RUC' ? null : apellidos.trim(),
        razonSocial: tipoDocumento === 'RUC' ? razonSocial.trim() : null,
        nombreContacto: tipoDocumento === 'RUC' ? (nombreContacto.trim() || null) : null,
        telefono: telefono.trim(),
        correo: correo.trim() || null,
        activo: clienteToEdit ? clienteToEdit.activo : true,
        vehiculos
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar cliente';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      description="Ingresa los datos personales y vehículos asociados del cliente."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errors.form}
          </div>
        )}

        {/* Document section */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Identificación Oficial
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Deseas desbloquear y modificar el número de documento? Asegúrate de que no cause colisiones.')) {
                    setIsDocUnlocked(true);
                  }
                }}
                className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1"
              >
                {isDocUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isDocUnlocked ? 'Documento editable' : 'Modificar documento'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tipo
              </label>
              <select
                disabled={isEditing && !isDocUnlocked}
                value={tipoDocumento}
                onChange={e => setTipoDocumento(e.target.value as TipoDocumento)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#3BBCFD] disabled:bg-slate-100"
              >
                <option value="CEDULA">Cédula</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="RUC">RUC</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Número de Documento
              </label>
              <input
                type="text"
                disabled={isEditing && !isDocUnlocked}
                value={numeroDocumento}
                onChange={e => setNumeroDocumento(e.target.value)}
                placeholder="10 dígitos para cédula, 13 para RUC"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold focus:ring-1 focus:ring-[#3BBCFD] disabled:bg-slate-100"
              />
              {errors.documento && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.documento}</p>
              )}
            </div>
          </div>
        </div>

        {/* Persona Natural or Empresa Fields */}
        {tipoDocumento === 'RUC' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Razón Social *
              </label>
              <input
                type="text"
                value={razonSocial}
                onChange={e => setRazonSocial(e.target.value)}
                placeholder="Nombre legal de la empresa"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#3BBCFD]"
              />
              {errors.razonSocial && <p className="text-xs text-rose-600 mt-1">{errors.razonSocial}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombre de contacto
              </label>
              <input
                type="text"
                value={nombreContacto}
                onChange={e => setNombreContacto(e.target.value)}
                placeholder="Persona responsable"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#3BBCFD]"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombres *
              </label>
              <input
                type="text"
                value={nombres}
                onChange={e => setNombres(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#3BBCFD]"
              />
              {errors.nombres && <p className="text-xs text-rose-600 mt-1">{errors.nombres}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                value={apellidos}
                onChange={e => setApellidos(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#3BBCFD]"
              />
              {errors.apellidos && <p className="text-xs text-rose-600 mt-1">{errors.apellidos}</p>}
            </div>
          </div>
        )}

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Teléfono celular (solo números) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={telefono}
              onChange={e => {
                const numbers = e.target.value.replace(/\D/g, '').slice(0, 10);
                setTelefono(numbers);
              }}
              placeholder="0991234567"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-[#3BBCFD]"
            />
            {errors.telefono && <p className="text-xs text-rose-600 mt-1">{errors.telefono}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#3BBCFD]"
            />
            {errors.correo && <p className="text-xs text-rose-600 mt-1">{errors.correo}</p>}
          </div>
        </div>

        {/* Vehicles Section */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-[#3BBCFD]" />
              <span>Vehículos asociados ({vehiculos.filter(v => v.activo).length})</span>
            </span>
            {!showVehicleForm && (
              <button
                type="button"
                onClick={() => setShowVehicleForm(true)}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar vehículo</span>
              </button>
            )}
          </div>

          {/* New Vehicle Form Box */}
          {showVehicleForm && (
            <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl mb-3 space-y-2.5">
              <div className="text-xs font-bold text-[#042544]">Nuevo Vehículo</div>
              {errors.vehicle && (
                <p className="text-xs text-rose-600 font-medium">{errors.vehicle}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Placa (ABC-1234)"
                  value={newPlaca}
                  onChange={e => {
                    const formatted = formatearPlacaEnTiempoReal(e.target.value);
                    setNewPlaca(formatted);
                  }}
                  className="px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono uppercase bg-white"
                />
                <input
                  type="text"
                  placeholder="Marca"
                  value={newMarca}
                  onChange={e => setNewMarca(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Modelo"
                  value={newModelo}
                  onChange={e => setNewModelo(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                />
                <select
                  value={newTipo}
                  onChange={e => setNewTipo(e.target.value as TipoVehiculo)}
                  className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white sm:col-span-4"
                >
                  <option value="AUTOMOVIL">Automóvil / Sedán</option>
                  <option value="SUV">SUV / Crossover</option>
                  <option value="CAMIONETA">Camioneta / Pick-Up</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleForm(false)}
                  className="px-3 py-1 rounded text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddVehicle}
                  className="px-3 py-1 rounded bg-[#042544] text-white text-xs font-bold"
                >
                  Guardar en lista
                </button>
              </div>
            </div>
          )}

          {/* List of vehicles */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {vehiculos.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay vehículos registrados para este cliente.</p>
            ) : (
              vehiculos.map((v, i) => (
                <div
                  key={v.placa}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                    v.activo ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold tracking-wider text-slate-900">
                      {v.placa}
                    </span>
                    <span className="text-slate-600">
                      {v.marca} {v.modelo} ({v.color}) · {v.tipoVehiculo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleVehicleActive(i)}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      v.activo
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {v.activo ? 'Desactivar' : 'Reactivar'}
                  </button>
                </div>
              ))
            )}
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
            {isSubmitting ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
