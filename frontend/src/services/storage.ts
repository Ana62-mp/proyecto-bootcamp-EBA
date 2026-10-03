/**
 * Storage abstraction layer for Car Wash
 * Isolates components from direct localStorage access and seeds data automatically.
 */
import {
  Cliente,
  ServicioLavado,
  TurnoCarwash,
  Usuario
} from '../types';
import {
  INITIAL_CLIENTES,
  INITIAL_SERVICIOS,
  INITIAL_TURNOS,
  INITIAL_USUARIOS
} from '../data/seedData';

const STORAGE_KEYS = {
  TURNOS: 'carwash_turnos_v1',
  CLIENTES: 'carwash_clientes_v1',
  USUARIOS: 'carwash_usuarios_v1',
  SERVICIOS: 'carwash_servicios_v1',
  CURRENT_USER: 'carwash_current_user_v1'
};

export const StorageService = {
  getTurnos(): TurnoCarwash[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TURNOS);
      if (!data) {
        this.saveTurnos(INITIAL_TURNOS);
        return INITIAL_TURNOS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TURNOS;
    }
  },

  saveTurnos(turnos: TurnoCarwash[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(turnos));
    } catch (e) {
      console.error('Error saving turnos to storage', e);
    }
  },

  getClientes(): Cliente[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLIENTES);
      if (!data) {
        this.saveClientes(INITIAL_CLIENTES);
        return INITIAL_CLIENTES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CLIENTES;
    }
  },

  saveClientes(clientes: Cliente[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
    } catch (e) {
      console.error('Error saving clientes to storage', e);
    }
  },

  getUsuarios(): Usuario[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USUARIOS);
      if (!data) {
        this.saveUsuarios(INITIAL_USUARIOS);
        return INITIAL_USUARIOS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_USUARIOS;
    }
  },

  saveUsuarios(usuarios: Usuario[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));
    } catch (e) {
      console.error('Error saving usuarios to storage', e);
    }
  },

  getServicios(): ServicioLavado[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICIOS);
      if (!data) {
        this.saveServicios(INITIAL_SERVICIOS);
        return INITIAL_SERVICIOS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SERVICIOS;
    }
  },

  saveServicios(servicios: ServicioLavado[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(servicios));
    } catch (e) {
      console.error('Error saving servicios to storage', e);
    }
  },

  getCurrentUser(): Usuario | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCurrentUser(user: Usuario | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Error saving current user to storage', e);
    }
  },

  resetAllData(): { turnos: TurnoCarwash[]; clientes: Cliente[]; usuarios: Usuario[]; servicios: ServicioLavado[] } {
    try {
      localStorage.removeItem(STORAGE_KEYS.TURNOS);
      localStorage.removeItem(STORAGE_KEYS.CLIENTES);
      localStorage.removeItem(STORAGE_KEYS.USUARIOS);
      localStorage.removeItem(STORAGE_KEYS.SERVICIOS);
      
      this.saveTurnos(INITIAL_TURNOS);
      this.saveClientes(INITIAL_CLIENTES);
      this.saveUsuarios(INITIAL_USUARIOS);
      this.saveServicios(INITIAL_SERVICIOS);

      return {
        turnos: INITIAL_TURNOS,
        clientes: INITIAL_CLIENTES,
        usuarios: INITIAL_USUARIOS,
        servicios: INITIAL_SERVICIOS
      };
    } catch (e) {
      console.error('Error resetting demonstration data', e);
      return {
        turnos: INITIAL_TURNOS,
        clientes: INITIAL_CLIENTES,
        usuarios: INITIAL_USUARIOS,
        servicios: INITIAL_SERVICIOS
      };
    }
  }
};
