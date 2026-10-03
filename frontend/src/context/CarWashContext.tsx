/**
 * CarWash Context & Operational State
 * Manages atomic state for turns, customers, stations, services, and live feedback.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Cliente,
  ServicioLavado,
  TurnoCarwash,
  Usuario,
  CrearTurnoInput,
  Vehiculo
} from '../types';
import { StorageService } from '../services/storage';
import { TurnosService } from '../services/turnosService';
import { useAuth } from './AuthContext';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface CarWashContextType {
  turnos: TurnoCarwash[];
  clientes: Cliente[];
  usuarios: Usuario[];
  servicios: ServicioLavado[];
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
  crearTurno: (input: CrearTurnoInput) => Promise<{ turno: TurnoCarwash; dispatched: boolean }>;
  avanzarEstado: (idTurno: number) => Promise<void>;
  entregarTurno: (idTurno: number) => Promise<void>;
  cancelarTurno: (idTurno: number) => Promise<void>;
  asignarTurnosPendientes: () => Promise<void>;
  refreshData: () => void;
  resetDemostracion: () => void;

  // Lookup helpers
  getClienteById: (idCliente: number) => Cliente | undefined;
  getVehiculoById: (idCliente: number, idVehiculo: number) => Vehiculo | undefined;
  getVehiculoByOnlyId: (idVehiculo: number) => Vehiculo | undefined;
  getServicioById: (idServicio: number) => ServicioLavado | undefined;
}

const CarWashContext = createContext<CarWashContextType | undefined>(undefined);

export const CarWashProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [turnos, setTurnos] = useState<TurnoCarwash[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [servicios, setServicios] = useState<ServicioLavado[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadData = useCallback(() => {
    const loadedTurnos = StorageService.getTurnos();
    const loadedClientes = StorageService.getClientes();
    const loadedUsuarios = StorageService.getUsuarios();
    const loadedServicios = StorageService.getServicios();

    setTurnos(loadedTurnos);
    setClientes(loadedClientes);
    setUsuarios(loadedUsuarios);
    setServicios(loadedServicios);
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to internal event bus for instant multi-view updates
    const unsubscribe = TurnosService.subscribe((evento, _payload) => {
      // Reload state on turn mutations
      const freshTurnos = StorageService.getTurnos();
      setTurnos(freshTurnos);
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

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

  // Helpers for querying entities
  const getClienteById = useCallback((idCliente: number) => {
    return clientes.find(c => c.idCliente === idCliente);
  }, [clientes]);

  const getVehiculoById = useCallback((idCliente: number, idVehiculo: number) => {
    const c = clientes.find(item => item.idCliente === idCliente);
    return c?.vehiculos.find(v => v.idVehiculo === idVehiculo);
  }, [clientes]);

  const getVehiculoByOnlyId = useCallback((idVehiculo: number) => {
    for (const c of clientes) {
      const found = c.vehiculos.find(v => v.idVehiculo === idVehiculo);
      if (found) return found;
    }
    return undefined;
  }, [clientes]);

  const getServicioById = useCallback((idServicio: number) => {
    return servicios.find(s => s.idServicio === idServicio);
  }, [servicios]);

  // FIFO and Station state computations
  const turnosEnEspera = useMemo(() => {
    return turnos
      .filter(t => t.estado === 'EN_ESPERA')
      .sort((a, b) => {
        const timeDiff = new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.idTurno - b.idTurno;
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
        return tB - tA; // Most recently completed first
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
    return turnos.find(
      t => t.numeroEstacion === 1 && (t.estado === 'LAVANDO' || t.estado === 'SECANDO_PULIENDO')
    ) || null;
  }, [turnos]);

  const estacion2Turno = useMemo(() => {
    return turnos.find(
      t => t.numeroEstacion === 2 && (t.estado === 'LAVANDO' || t.estado === 'SECANDO_PULIENDO')
    ) || null;
  }, [turnos]);

  // Operational Actions
  const crearTurno = async (input: CrearTurnoInput) => {
    try {
      const result = await TurnosService.crearTurno({
        ...input,
        idUsuarioCreador: currentUser?.idUsuario
      });
      loadData();

      const vehiculo = getVehiculoByOnlyId(result.turno.idVehiculo);
      const placaText = vehiculo?.placa || 'del vehículo';

      if (result.dispatched && result.turno.numeroEstacion) {
        showToast(
          `¡Turno #${result.turno.idTurno} creado! Vehículo ${placaText} asignado directamente a Estación ${result.turno.numeroEstacion}.`,
          'success'
        );
      } else {
        showToast(
          `Turno #${result.turno.idTurno} creado con éxito para ${placaText}. Ha ingresado a la cola de espera FIFO.`,
          'info'
        );
      }

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear turno';
      showToast(msg, 'error');
      throw err;
    }
  };

  const avanzarEstado = async (idTurno: number) => {
    try {
      const usuarioId = currentUser?.idUsuario || 1;
      const target = turnos.find(t => t.idTurno === idTurno);
      const vehiculo = target ? getVehiculoByOnlyId(target.idVehiculo) : null;
      const placaText = vehiculo?.placa || `Turno #${idTurno}`;

      const res = await TurnosService.avanzarEstado(idTurno, usuarioId);
      loadData();

      if (res.turno.estado === 'SECANDO_PULIENDO') {
        showToast(`Vehículo ${placaText} pasó a etapa de secado y pulido.`, 'info');
      } else if (res.turno.estado === 'LISTO') {
        if (res.siguienteAsignado) {
          const nextVehiculo = getVehiculoByOnlyId(res.siguienteAsignado.idVehiculo);
          showToast(
            `Vehículo ${placaText} marcado como listo. Siguiente vehículo asignado: ${nextVehiculo?.placa || 'Turno #' + res.siguienteAsignado.idTurno}.`,
            'success'
          );
        } else {
          showToast(`Vehículo ${placaText} marcado como listo. La estación ahora está disponible.`, 'success');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al avanzar estado';
      showToast(msg, 'error');
      throw err;
    }
  };

  const entregarTurno = async (idTurno: number) => {
    try {
      const usuarioId = currentUser?.idUsuario || 1;
      const target = turnos.find(t => t.idTurno === idTurno);
      const vehiculo = target ? getVehiculoByOnlyId(target.idVehiculo) : null;
      const placaText = vehiculo?.placa || `Turno #${idTurno}`;

      await TurnosService.entregarTurno(idTurno, usuarioId);
      loadData();
      showToast(`Vehículo ${placaText} entregado con éxito al cliente.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al entregar turno';
      showToast(msg, 'error');
      throw err;
    }
  };

  const cancelarTurno = async (idTurno: number) => {
    try {
      const usuarioId = currentUser?.idUsuario || 1;
      const target = turnos.find(t => t.idTurno === idTurno);
      const vehiculo = target ? getVehiculoByOnlyId(target.idVehiculo) : null;
      const placaText = vehiculo?.placa || `Turno #${idTurno}`;

      await TurnosService.cancelarTurno(idTurno, usuarioId);
      loadData();
      showToast(`Turno de ${placaText} cancelado correctamente. Cola reasignada.`, 'warning');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar turno';
      showToast(msg, 'error');
      throw err;
    }
  };

  const asignarTurnosPendientes = async () => {
    try {
      await TurnosService.asignarTurnosPendientes(currentUser?.idUsuario || null);
      loadData();
    } catch (err: unknown) {
      console.error('Error al despachar turnos', err);
    }
  };

  const refreshData = () => {
    loadData();
  };

  const resetDemostracion = () => {
    const data = StorageService.resetAllData();
    setTurnos(data.turnos);
    setClientes(data.clientes);
    setUsuarios(data.usuarios);
    setServicios(data.servicios);
    showToast('Datos de demostración restablecidos con éxito.', 'info');
  };

  return (
    <CarWashContext.Provider
      value={{
        turnos,
        clientes,
        usuarios,
        servicios,
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
        resetDemostracion,
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
