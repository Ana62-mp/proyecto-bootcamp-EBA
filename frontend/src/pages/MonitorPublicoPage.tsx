/**
 * MonitorPublicoPage: High-Contrast Public TV Screen
 * Conforms strictly to Spec Section 14:
 * - Fullscreen deep navy background (#042544)
 * - Large white monospace license plates for high visibility on wall-mounted TV monitors
 * - Real-time digital clock
 * - Green "Vehículos listos para retiro" section with pickup notice
 * - "En proceso de lavado y detallado" with 2 station cards
 * - Zero personal customer data exposed
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarWash } from '../context/CarWashContext';
import { Logo } from '../components/common/Logo';
import { EstadoBadge } from '../components/common/Badge';
import { Maximize2, Minimize2, ArrowLeft, CheckCircle2, Droplets, Clock } from 'lucide-react';

export const MonitorPublicoPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    turnosListos,
    estacion1Turno,
    estacion2Turno,
    getVehiculoById,
    getServicioById
  } = useCarWash();

  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Digital Clock Updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-EC', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
      setCurrentDate(
        now.toLocaleDateString('es-EC', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const v1 = estacion1Turno ? getVehiculoById(estacion1Turno.idCliente, estacion1Turno.idVehiculo) : null;
  const s1 = estacion1Turno ? getServicioById(estacion1Turno.idServicio) : null;

  const v2 = estacion2Turno ? getVehiculoById(estacion2Turno.idCliente, estacion2Turno.idVehiculo) : null;
  const s2 = estacion2Turno ? getServicioById(estacion2Turno.idServicio) : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#042544] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-y-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-6 border-b border-[#083d6e]">
        <div className="flex items-center gap-4">
          <Logo size="lg" showSubtitle={false} />
          <div className="hidden sm:block border-l border-[#083d6e] pl-4">
            <h1 className="text-xl font-black tracking-wider uppercase text-white">
              Monitoreo de Turnos en Vivo
            </h1>
            <p className="text-xs text-[#3BBCFD] tracking-widest font-semibold uppercase">
              Pantalla Pública de Clientes
            </p>
          </div>
        </div>

        {/* Centered Digital Clock */}
        <div className="text-center font-mono">
          <div className="text-3xl sm:text-4xl font-black tracking-widest text-white drop-shadow-md">
            {currentTime}
          </div>
          <div className="text-[11px] text-[#BFC3CC] capitalize tracking-wide font-sans mt-0.5">
            {currentDate}
          </div>
        </div>

        {/* Discreet Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="p-2.5 rounded-xl bg-[#063057] hover:bg-[#083d6e] text-[#BFC3CC] hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            title="Volver al panel"
            className="p-2.5 rounded-xl bg-[#063057] hover:bg-[#083d6e] text-[#BFC3CC] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Display Grid */}
      <main className="flex-1 my-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Section 1: Ready for Pickup (Green Theme) */}
        <div className="bg-[#052d52] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-[#094275] mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-emerald-400">
                  Vehículos listos para retiro
                </h2>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Puede acercarse a retirar su vehículo en la zona de entrega.
                </p>
              </div>
            </div>

            {turnosListos.length === 0 ? (
              <div className="py-20 text-center text-[#BFC3CC]/60 flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-[#083d6e] mb-3" />
                <p className="text-sm font-semibold">No hay vehículos listos por el momento</p>
                <p className="text-xs text-[#BFC3CC]/40 mt-1">Los vehículos finalizados aparecerán aquí</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {turnosListos.map(turno => {
                  const vehiculo = getVehiculoById(turno.idCliente, turno.idVehiculo);

                  return (
                    <div
                      key={turno.idTurno}
                      className="p-5 rounded-2xl bg-[#042544] border-2 border-emerald-500/60 shadow-lg text-center transform hover:scale-[1.02] transition-transform"
                    >
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                        LISTO EN PARQUEADERO
                      </span>
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white block my-1">
                        {vehiculo?.placa || '---'}
                      </span>
                      <span className="text-xs font-semibold text-[#BFC3CC]">
                        {vehiculo?.marca} {vehiculo?.modelo}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#094275] text-center text-xs font-medium text-emerald-300/80">
            Zona de Entrega y Parqueadero · Presente su comprobante en caja
          </div>
        </div>

        {/* Section 2: In Process in Stations */}
        <div className="bg-[#052d52] border-2 border-[#3BBCFD]/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-[#094275] mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#3BBCFD]/20 text-[#3BBCFD] flex items-center justify-center">
                <Droplets className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white">
                  En proceso de lavado y detallado
                </h2>
                <p className="text-xs text-[#BFC3CC] mt-0.5">
                  Bahías de lavado activas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Estación 1 */}
              <div className="p-5 rounded-2xl bg-[#042544] border border-[#083d6e] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3BBCFD] text-[#042544]">
                      ESTACIÓN 1
                    </span>
                    {estacion1Turno ? (
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span>{estacion1Turno.estado === 'LAVANDO' ? 'LAVANDO' : 'SECADO Y PULIDO'}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>DISPONIBLE</span>
                      </span>
                    )}
                  </div>

                  {estacion1Turno ? (
                    <div>
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white block my-1">
                        {v1?.placa || '---'}
                      </span>
                      <span className="text-xs text-[#BFC3CC]">
                        {s1?.nombre} · {v1?.marca} {v1?.modelo}
                      </span>
                    </div>
                  ) : (
                    <div className="py-2 text-sm text-[#BFC3CC]/60 font-semibold">
                      Estación libre para recibir vehículo
                    </div>
                  )}
                </div>

                {estacion1Turno && (
                  <div className="text-right font-mono text-xs text-[#3BBCFD] font-bold bg-[#063057] px-3 py-2 rounded-xl">
                    EN BAHÍA
                  </div>
                )}
              </div>

              {/* Estación 2 */}
              <div className="p-5 rounded-2xl bg-[#042544] border border-[#083d6e] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3BBCFD] text-[#042544]">
                      ESTACIÓN 2
                    </span>
                    {estacion2Turno ? (
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span>{estacion2Turno.estado === 'LAVANDO' ? 'LAVANDO' : 'SECADO Y PULIDO'}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>DISPONIBLE</span>
                      </span>
                    )}
                  </div>

                  {estacion2Turno ? (
                    <div>
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white block my-1">
                        {v2?.placa || '---'}
                      </span>
                      <span className="text-xs text-[#BFC3CC]">
                        {s2?.nombre} · {v2?.marca} {v2?.modelo}
                      </span>
                    </div>
                  ) : (
                    <div className="py-2 text-sm text-[#BFC3CC]/60 font-semibold">
                      Estación libre para recibir vehículo
                    </div>
                  )}
                </div>

                {estacion2Turno && (
                  <div className="text-right font-mono text-xs text-[#3BBCFD] font-bold bg-[#063057] px-3 py-2 rounded-xl">
                    EN BAHÍA
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#094275] text-center text-xs text-[#BFC3CC]/70">
            Actualización automática en tiempo real sin recargar la pantalla
          </div>
        </div>
      </main>

      {/* Footer Strip */}
      <footer className="pt-4 border-t border-[#083d6e] flex items-center justify-between text-xs text-[#BFC3CC]">
        <span>Sistema de Turnos Car Wash · Terminal Pública</span>
        <span>Por favor conserve su comprobante de turno</span>
      </footer>
    </div>
  );
};
