/**
 * LoginPage: System Access
 * Conforms to Spec Section 7:
 * - Logo over dark navy surface
 * - Username & password authentication
 * - Collapsible "Accesos de prueba" block with one-click credential fills
 * - Role-based post-login redirection
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/common/Logo';
import { INITIAL_USUARIOS } from '../data/seedData';
import { LogIn, KeyRound, User, ChevronDown, ChevronUp, AlertCircle, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim() || !password) {
      setError('Por favor completa todos los campos para ingresar.');
      return;
    }

    setIsLoading(true);
    const result = await login(usuario, password);
    setIsLoading(false);

    if (result.success) {
      // Find logged in user to redirect to role home
      const match = INITIAL_USUARIOS.find(u => u.usuario.toLowerCase() === usuario.trim().toLowerCase());
      if (match?.rol === 'ADMIN') {
        navigate('/resumen');
      } else if (match?.rol === 'MAQUINA') {
        navigate('/turnos/nuevo');
      } else if (match?.rol === 'LAVADOR') {
        navigate('/estaciones');
      } else {
        navigate('/resumen');
      }
    } else {
      setError(result.error || 'Credenciales inválidas.');
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsuario(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-[#042544] flex flex-col justify-center items-center p-4 selection:bg-[#3BBCFD]/30 selection:text-white">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Brand Logo Lockup */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" showSubtitle={true} />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-black text-[#042544]">
              Acceso al Sistema
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa tus credenciales para acceder a tu terminal o módulo
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-user" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <input
                  id="login-user"
                  type="text"
                  autoFocus
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  placeholder="ej: admin, kiosk01, carlos"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] focus:border-transparent font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="login-pass" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-pass"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#3BBCFD] focus:border-transparent font-medium font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#042544] hover:bg-[#073663] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4 text-[#3BBCFD]" />
              <span>{isLoading ? 'Comprobando...' : 'Iniciar sesión'}</span>
            </button>
          </form>
        </div>

        {/* Collapsible Demo Credentials Box (Spec Section 7) */}
        <div className="mt-6 bg-[#063057]/90 rounded-2xl border border-[#083d6e] overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowDemoCredentials(!showDemoCredentials)}
            className="w-full p-3.5 flex items-center justify-between text-[#BFC3CC] hover:text-white font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#3BBCFD]" />
              <span>Accesos de prueba (demostración)</span>
            </div>
            {showDemoCredentials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDemoCredentials && (
            <div className="p-4 pt-1 space-y-2 border-t border-[#083d6e]/60 text-slate-300">
              <p className="text-[11px] text-slate-400 mb-2">
                Haz clic en cualquier rol para autorrellenar las credenciales correspondientes:
              </p>

              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'admin123')}
                  className="p-2 rounded-lg bg-[#042544] hover:bg-[#073663] text-left flex items-center justify-between border border-[#0a4882] transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block">Administrador</span>
                    <span className="text-[10px] text-slate-400">admin / admin123 · Acceso total</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#3BBCFD] bg-[#0284c7]/20 px-2 py-0.5 rounded">
                    ADMIN
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('kiosk01', 'kiosk123')}
                  className="p-2 rounded-lg bg-[#042544] hover:bg-[#073663] text-left flex items-center justify-between border border-[#0a4882] transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block">Kiosko Autoservicio 1</span>
                    <span className="text-[10px] text-slate-400">kiosk01 / kiosk123 · KIOSK-01</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                    MAQUINA
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('carlos', 'lavador123')}
                  className="p-2 rounded-lg bg-[#042544] hover:bg-[#073663] text-left flex items-center justify-between border border-[#0a4882] transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block">Carlos Mendoza (Lavador 1)</span>
                    <span className="text-[10px] text-slate-400">carlos / lavador123 · Estación 1</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    LAVADOR
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
