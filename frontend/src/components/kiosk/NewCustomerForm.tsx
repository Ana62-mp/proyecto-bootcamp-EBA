/**
 * Step 2B: New Customer Registration Form
 * Conforms to Spec Section 8.3
 */
import React, { useState } from 'react';
import { TipoDocumento } from '../../types';
import { TIPO_DOCUMENTO_LABELS } from '../../utils/formatters';
import { validarCorreo, validarCelular } from '../../utils/documentValidators';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

interface NewCustomerFormProps {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  onBack: () => void;
  onSubmit: (datos: {
    nombres: string | null;
    apellidos: string | null;
    razonSocial: string | null;
    nombreContacto: string | null;
    telefono: string;
    correo: string | null;
  }) => void;
}

export const NewCustomerForm: React.FC<NewCustomerFormProps> = ({
  tipoDocumento,
  numeroDocumento,
  onBack,
  onSubmit
}) => {
  const isRuc = tipoDocumento === 'RUC';

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};

    if (isRuc) {
      if (!razonSocial.trim()) errs.razonSocial = 'La razón social es obligatoria.';
    } else {
      if (!nombres.trim()) errs.nombres = 'Los nombres son obligatorios.';
      if (!apellidos.trim()) errs.apellidos = 'Los apellidos son obligatorios.';
    }

    const phoneVal = validarCelular(telefono);
    if (!phoneVal.isValid) {
      errs.telefono = phoneVal.errorMessage || 'Número de celular inválido.';
    }

    if (correo.trim()) {
      const emailVal = validarCorreo(correo);
      if (!emailVal.isValid) {
        errs.correo = emailVal.errorMessage || 'El correo debe tener formato válido con @ y .';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      nombres: isRuc ? null : nombres.trim(),
      apellidos: isRuc ? null : apellidos.trim(),
      razonSocial: isRuc ? razonSocial.trim() : null,
      nombreContacto: isRuc ? (nombreContacto.trim() || null) : null,
      telefono: telefono.trim(),
      correo: correo.trim() || null
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs font-bold text-[#042544] mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#3BBCFD]" />
          <span>Nuevo cliente</span>
        </div>
        <h2 className="text-2xl font-black text-[#042544]">
          Parece que es tu primera visita
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Completa tus datos para registrarte y generar tu turno de forma rápida.
        </p>

        {/* Document Identifier Banner */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {TIPO_DOCUMENTO_LABELS[tipoDocumento]}:
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {numeroDocumento}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRuc ? (
          <>
            <div>
              <label htmlFor="razonSocial" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Razón Social *
              </label>
              <input
                id="razonSocial"
                type="text"
                autoFocus
                value={razonSocial}
                onChange={e => setRazonSocial(e.target.value)}
                placeholder="Nombre de la empresa o negocio"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] text-sm"
              />
              {errors.razonSocial && (
                <p className="text-xs text-rose-600 mt-1">{errors.razonSocial}</p>
              )}
            </div>

            <div>
              <label htmlFor="nombreContacto" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombre de contacto (opcional)
              </label>
              <input
                id="nombreContacto"
                type="text"
                value={nombreContacto}
                onChange={e => setNombreContacto(e.target.value)}
                placeholder="Persona encargada o chofer"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] text-sm"
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="nombres" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombres *
              </label>
              <input
                id="nombres"
                type="text"
                autoFocus
                value={nombres}
                onChange={e => setNombres(e.target.value)}
                placeholder="Tus nombres"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] text-sm"
              />
              {errors.nombres && (
                <p className="text-xs text-rose-600 mt-1">{errors.nombres}</p>
              )}
            </div>

            <div>
              <label htmlFor="apellidos" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Apellidos *
              </label>
              <input
                id="apellidos"
                type="text"
                value={apellidos}
                onChange={e => setApellidos(e.target.value)}
                placeholder="Tus apellidos"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] text-sm"
              />
              {errors.apellidos && (
                <p className="text-xs text-rose-600 mt-1">{errors.apellidos}</p>
              )}
            </div>
          </div>
        )}

        {/* Telefono & Correo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="telefono" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Teléfono celular (solo números) *
            </label>
            <input
              id="telefono"
              type="tel"
              inputMode="numeric"
              value={telefono}
              onChange={e => {
                const numbersOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                setTelefono(numbersOnly);
              }}
              placeholder="0991234567"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] text-sm font-mono"
            />
            {errors.telefono && (
              <p className="text-xs text-rose-600 mt-1">{errors.telefono}</p>
            )}
          </div>

          <div>
            <label htmlFor="correo" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Correo electrónico (opcional)
            </label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="nombre@ejemplo.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] text-sm"
            />
            {errors.correo && (
              <p className="text-xs text-rose-600 mt-1">{errors.correo}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Regresar</span>
          </button>

          <button
            type="submit"
            className="flex-1 py-3.5 px-6 rounded-xl bg-[#042544] hover:bg-[#073663] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Continuar al vehículo</span>
            <ArrowRight className="w-4 h-4 text-[#3BBCFD]" />
          </button>
        </div>
      </form>
    </div>
  );
};
