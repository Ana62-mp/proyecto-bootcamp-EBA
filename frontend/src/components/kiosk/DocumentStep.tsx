/**
 * Step 1: Document Type and Number Input
 * Conforms to Spec Section 8.1
 */
import React from 'react';
import { TipoDocumento } from '../../types';
import { validarDocumento } from '../../utils/documentValidators';
import { CreditCard, Globe, Building2, ArrowRight, AlertTriangle } from 'lucide-react';

interface DocumentStepProps {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  onChangeTipo: (tipo: TipoDocumento) => void;
  onChangeNumero: (numero: string) => void;
  onContinue: () => void;
  error?: string;
  setError: (err: string) => void;
  isSearching: boolean;
}

export const DocumentStep: React.FC<DocumentStepProps> = ({
  tipoDocumento,
  numeroDocumento,
  onChangeTipo,
  onChangeNumero,
  onContinue,
  error,
  setError,
  isSearching
}) => {
  const handleTypeSelect = (tipo: TipoDocumento) => {
    if (tipo === tipoDocumento) return;
    onChangeTipo(tipo);
    onChangeNumero('');
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setError('');

    if (tipoDocumento === 'CEDULA') {
      const clean = val.replace(/\D/g, '').slice(0, 10);
      onChangeNumero(clean);
    } else if (tipoDocumento === 'RUC') {
      const clean = val.replace(/\D/g, '').slice(0, 13);
      onChangeNumero(clean);
    } else {
      // Pasaporte: uppercase alphanumeric, max 20
      const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
      onChangeNumero(clean);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching) return;

    const validation = validarDocumento(tipoDocumento, numeroDocumento);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Documento no válido.');
      return;
    }

    onContinue();
  };

  const inputConfig = {
    CEDULA: {
      label: 'Número de Cédula',
      placeholder: 'Ejemplo: 1710034065 (10 dígitos)',
      inputMode: 'numeric' as const,
      help: 'Ingresa los 10 dígitos sin espacios ni guiones.'
    },
    PASAPORTE: {
      label: 'Número de Pasaporte',
      placeholder: 'Ejemplo: A9823412 (6 a 20 caracteres)',
      inputMode: 'text' as const,
      help: 'Ingresa letras y números sin caracteres especiales.'
    },
    RUC: {
      label: 'Número de RUC',
      placeholder: 'Ejemplo: 1710034065001 (13 dígitos terminado en 001)',
      inputMode: 'numeric' as const,
      help: 'RUC ecuatoriano de 13 dígitos terminado en 001.'
    }
  }[tipoDocumento];

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#042544] tracking-tight mb-2">
          Bienvenido al Car Wash
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Selecciona tu documento e ingresa el número para comenzar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Type Selector Buttons */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Tipo de identificación
          </label>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => handleTypeSelect('CEDULA')}
              className={`py-3.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all min-h-[44px] ${
                tipoDocumento === 'CEDULA'
                  ? 'bg-[#042544] text-white border-[#042544] shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-5 h-5 text-[#3BBCFD]" />
              <span>Cédula</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelect('PASAPORTE')}
              className={`py-3.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all min-h-[44px] ${
                tipoDocumento === 'PASAPORTE'
                  ? 'bg-[#042544] text-white border-[#042544] shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-5 h-5 text-[#3BBCFD]" />
              <span>Pasaporte</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelect('RUC')}
              className={`py-3.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all min-h-[44px] ${
                tipoDocumento === 'RUC'
                  ? 'bg-[#042544] text-white border-[#042544] shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-5 h-5 text-[#3BBCFD]" />
              <span>RUC</span>
            </button>
          </div>
        </div>

        {/* Document Number Input */}
        <div>
          <label htmlFor="doc-number" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {inputConfig.label}
          </label>
          <div className="relative">
            <input
              id="doc-number"
              type="text"
              autoFocus
              inputMode={inputConfig.inputMode}
              value={numeroDocumento}
              onChange={handleInputChange}
              placeholder={inputConfig.placeholder}
              className={`w-full px-4 py-3.5 text-lg font-mono rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/30'
                  : 'border-slate-300 focus:ring-[#3BBCFD] focus:border-transparent'
              }`}
            />
          </div>
          {error ? (
            <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1.5" role="alert">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1.5">{inputConfig.help}</p>
          )}
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={!numeroDocumento || isSearching}
          className="w-full py-4 px-6 rounded-xl bg-[#042544] hover:bg-[#073663] disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px]"
        >
          {isSearching ? (
            <span>Consultando...</span>
          ) : (
            <>
              <span>Continuar</span>
              <ArrowRight className="w-5 h-5 text-[#3BBCFD]" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
