/**
 * CarWash Context & Operational State
 * Estado operativo sincronizado con el backend: turnos, servicios y máquinas.
 * Los turnos se refrescan por REST cada pocos segundos; el despacho FIFO ocurre en el servidor.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react';
import {
  Cliente,
  ServicioLavado,
  TurnoCarwash,
  Usuario,
  CrearTurnoInput,
  Vehiculo
} from '../types';
import { TurnosService } from '../services/turnosService';
import { ServiciosLavadoService } from '../services/serviciosLavadoService';
import { UsuariosService } from '../services/usuariosService';
import { newIdempotencyKey } from '../services/api';
import { useAuth } from './AuthContext';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const POLL_INTERVAL_MS = 5000;

interface CarWashContextType {
  turnos: TurnoCarwash[];
  servicios: ServicioLavado[];
  /** Kioscos activos (solo se cargan para ADMIN, que debe elegir la máquina destino). */
  maquinas: Usuario[];
  maquinaDestinoId: string | null;
  setMaquinaDestinoId: (id: string | null) => void;
  toast: ToastMessage | null;
  clearToast: () => void;
  showToast: (message: string, type?: ToastMessage['type']) => void;

  // FIFO & Station Computations
  turnosEnEspera: TurnoCarwash[];
  turnosEnProceso: TurnoCarwash[];
  turnosListos: TurnoCarwash[];
  turnosHistorial: TurnoCarwash[];
  estacion1Turno: TurnoCarwash | null;
  estacion2Turno: TurnoCarwash | null;

  // Actions
  crearTurno: (
    input: CrearTurnoInput,
    idempotencyKey?: string
  ) => Promise<{ turno: TurnoCarwash; dispatched: boolean }>;
  avanzarEstado: (idTurno: string) => Promise<void>;
  entregarTurno: (idTurno: string) => Promise<void>;
  cancelarTurno: (idTurno: string) => Promise<void>;
  asignarTurnosPendientes: () => Promise<void>;
  refreshData: () => void;

  // Lookup helpers (a partir de la copia del comprobante guardada en cada turno)
  getClienteById: (idCliente: string) => Cliente | undefined;
  getVehiculoById: (idCliente: string, idVehiculo: string) => Vehiculo | undefined;
  getVehiculoByOnlyId: (idVehiculo: string) => Vehiculo | undefined;
  getServicioById: (idServicio: string) => ServicioLavado | undefined;
}

const CarWashContext = createContext<CarWashContextType | undefined>(undefined);

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export const CarWashProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [turnos, setTurnos] = useState<TurnoCarwash[]>([]);
  // Comprobantes emitidos en esta sesión: aportan los datos del cliente que la vista pública no trae.
  const [emitidos, setEmitidos] = useState<TurnoCarwash[]>([]);
  const [servicios, setServicios] = useState<ServicioLavado[]>([]);
  const [maquinas, setMaquinas] = useState<Usuario[]>([]);
  const [maquinaDestinoId, setMaquinaDestinoId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const loadingRef = useRef(false);

  const rol = currentUser?.rol ?? null;

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 4500);
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const loadTurnos = useCallback(async () => {
    if (!rol || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const [activos, historial] = await Promise.all([
        TurnosService.listarActivos(rol),
        rol === 'ADMIN' ? TurnosService.listarHistorial() : Promise.resolve([])
      ]);
      setTurnos([...activos, ...historial]);
    } catch (err) {
      console.error('No se pudieron cargar los turnos', err);
    } finally {
      loadingRef.current = false;
    }
  }, [rol]);

  const loadCatalogos = useCallback(async () => {
    if (!rol) return;
    try {
      setServicios(await ServiciosLavadoService.listar(rol === 'ADMIN'));
      if (rol === 'ADMIN') {
        const lista = await UsuariosService.listarMaquinasActivas();
        setMaquinas(lista);
        setMaquinaDestinoId(prev =>
          prev && lista.some(m => m.idUsuario === prev) ? prev : lista[0]?.idUsuario ?? null
        );
      }
    } catch (err) {
      console.error('No se pudieron cargar los catálogos', err);
    }
  }, [rol]);

  useEffect(() => {
    if (!rol) {
      setTurnos([]);
      setEmitidos([]);
      setServicios([]);
      setMaquinas([]);
      return;
    }
    loadCatalogos();
    loadTurnos();
    const timer = setInterval(loadTurnos, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [rol, loadCatalogos, loadTurnos]);

  // ---------- Lookups ----------

  const snapshots = useMemo(() => [...emitidos, ...turnos], [emitidos, turnos]);

  const getClienteById = useCallback(
    (idCliente: string): Cliente | undefined => {
      const t = snapshots.find(x => x.idCliente === idCliente && x.cliente);
      if (!t || !t.cliente) return undefined;
      return {
        idCliente,
        tipoDocumento: t.cliente.tipoDocumento,
        numeroDocumento: t.cliente.numeroDocumento,
        nombres: t.cliente.nombre,
        apellidos: null,
        razonSocial: null,
        nombreContacto: null,
        telefono: '',
        correo: null,
        activo: true,
        vehiculos: [],
        fechaRegistro: t.fechaIngreso,
        fechaActualizacion: t.fechaIngreso
      };
    },
    [snapshots]
  );

  const getVehiculoByOnlyId = useCallback(
    (idVehiculo: string): Vehiculo | undefined => {
      const t = snapshots.find(x => x.idVehiculo === idVehiculo);
      if (!t) return undefined;
      return {
        idVehiculo,
        idCliente: t.idCliente,
        placa: t.vehiculo.placa,
        marca: t.vehiculo.marca,
        modelo: t.vehiculo.modelo,
        color: t.vehiculo.color,
        tipoVehiculo: t.vehiculo.tipoVehiculo ?? 'OTRO',
        activo: true
      };
    },
    [snapshots]
  );

  const getVehiculoById = useCallback(
    (_idCliente: string, idVehiculo: string) => getVehiculoByOnlyId(idVehiculo),
    [getVehiculoByOnlyId]
  );

  const getServicioById = useCallback(
    (idServicio: string): ServicioLavado | undefined => {
      const servicio = servicios.find(s => s.idServicio === idServicio);
      if (servicio) return servicio;
      const t = snapshots.find(x => x.idServicio === idServicio);
      if (!t) return undefined;
      return {
        idServicio,
        codigo: 'LAVADO_SIMPLE',
        nombre: t.servicioNombre,
        descripcion: '',
        precio: t.precioServicio,
        activo: true
      };
    },
    [servicios, snapshots]
  );

  // ---------- FIFO and Station state computations ----------

  const turnosEnEspera = useMemo(() => {
    return turnos
      .filter(t => t.estado === 'EN_ESPERA')
      .sort((a, b) => {
        const timeDiff = new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.numeroTurno.localeCompare(b.numeroTurno);
      });
  }, [turnos]);

  const turnosEnProceso = useMemo(() => {
    return turnos.filter(t => t.estado === 'LAVANDO' || t.estado === 'SECANDO_PULIENDO');
  }, [turnos]);

  const turnosListos = useMemo(() => {
    return turnos
      .filter(t => t.estado === 'LISTO')
      .sort((a, b) => {
        const tA = a.fechaFinalizacion ? new Date(a.fechaFinalizacion).getTime() : 0;
        const tB = b.fechaFinalizacion ? new Date(b.fechaFinalizacion).getTime() : 0;
        return tB - tA;
      });
  }, [turnos]);

  const turnosHistorial = useMemo(() => {
    return turnos
      .filter(t => t.estado === 'ENTREGADO' || t.estado === 'CANCELADO')
      .sort((a, b) => {
        const dateA = a.fechaEntrega || a.historialEstados[a.historialEstados.length - 1]?.fecha || a.fechaIngreso;
        const dateB = b.fechaEntrega || b.historialEstados[b.historialEstados.length - 1]?.fecha || b.fechaIngreso;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [turnos]);

  const estacion1Turno = useMemo(() => {
    return (
      turnos.find(
        t => t.numeroEstacion === 1 && (t.estado === 'LAVANDO' || t.estado === 'SECANDO_PULIENDO')
      ) || null
    );
  }, [turnos]);

  const estacion2Turno = useMemo(() => {
    return (
      turnos.find(
        t => t.numeroEstacion === 2 && (t.estado === 'LAVANDO' || t.estado === 'SECANDO_PULIENDO')
      ) || null
    );
  }, [turnos]);

  // ---------- Operational Actions ----------

  const placaDe = (idTurno: string) =>
    turnos.find(t => t.idTurno === idTurno)?.vehiculo.placa ?? 'del vehículo';

  const crearTurno = async (input: CrearTurnoInput, idempotencyKey = newIdempotencyKey()) => {
    try {
      const machineId = rol === 'ADMIN' ? input.machineId ?? maquinaDestinoId ?? undefined : undefined;
      if (rol === 'ADMIN' && !machineId) {
        throw new Error('Selecciona el kiosko destino del ticket.');
      }
      const result = await TurnosService.emitirTicket({ ...input, machineId }, idempotencyKey);
      setEmitidos(prev => [result.turno, ...prev.filter(t => t.idTurno !== result.turno.idTurno)].slice(0, 20));
      loadTurnos();

      const { turno } = result;
      if (result.dispatched && turno.numeroEstacion) {
        showToast(
          `¡Turno ${turno.numeroTurno} creado! Vehículo ${turno.vehiculo.placa} asignado directamente a Estación ${turno.numeroEstacion}.`,
          'success'
        );
      } else {
        showToast(
          `Turno ${turno.numeroTurno} creado con éxito para ${turno.vehiculo.placa}. Ha ingresado a la cola de espera FIFO.`,
          'info'
        );
      }
      return { turno, dispatched: result.dispatched };
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error al crear turno'), 'error');
      throw err;
    }
  };

  const avanzarEstado = async (idTurno: string) => {
    try {
      const placaText = placaDe(idTurno);
      const res = await TurnosService.avanzarEstado(idTurno);
      await loadTurnos();

      if (res.turno.estado === 'SECANDO_PULIENDO') {
        showToast(`Vehículo ${placaText} pasó a etapa de secado y pulido.`, 'info');
      } else if (res.turno.estado === 'LISTO') {
        if (res.siguienteAsignado) {
          showToast(
            `Vehículo ${placaText} marcado como listo. Siguiente vehículo asignado: ${res.siguienteAsignado.vehiculo.placa}.`,
            'success'
          );
        } else {
          showToast(`Vehículo ${placaText} marcado como listo. La estación ahora está disponible.`, 'success');
        }
      }
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error al avanzar estado'), 'error');
      throw err;
    }
  };

  const entregarTurno = async (idTurno: string) => {
    try {
      const placaText = placaDe(idTurno);
      await TurnosService.entregarTurno(idTurno);
      await loadTurnos();
      showToast(`Vehículo ${placaText} entregado con éxito al cliente.`, 'success');
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error al entregar turno'), 'error');
      throw err;
    }
  };

  const cancelarTurno = async (idTurno: string) => {
    try {
      const placaText = placaDe(idTurno);
      await TurnosService.cancelarTurno(idTurno);
      await loadTurnos();
      showToast(`Turno de ${placaText} cancelado correctamente. Cola reasignada.`, 'warning');
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error al cancelar turno'), 'error');
      throw err;
    }
  };

  const asignarTurnosPendientes = async () => {
    try {
      await TurnosService.asignarTurnosPendientes();
      await loadTurnos();
    } catch (err: unknown) {
      console.error('Error al despachar turnos', err);
    }
  };

  const refreshData = () => {
    loadTurnos();
    loadCatalogos();
  };

  return (
    <CarWashContext.Provider
      value={{
        turnos,
        servicios,
        maquinas,
        maquinaDestinoId,
        setMaquinaDestinoId,
        toast,
        clearToast,
        showToast,
        turnosEnEspera,
        turnosEnProceso,
        turnosListos,
        turnosHistorial,
        estacion1Turno,
        estacion2Turno,
        crearTurno,
        avanzarEstado,
        entregarTurno,
        cancelarTurno,
        asignarTurnosPendientes,
        refreshData,
        getClienteById,
        getVehiculoById,
        getVehiculoByOnlyId,
        getServicioById
      }}
    >
      {children}
    </CarWashContext.Provider>
  );
};

export const useCarWash = (): CarWashContextType => {
  const context = useContext(CarWashContext);
  if (!context) {
    throw new Error('useCarWash must be used within a CarWashProvider');
  }
  return context;
};
