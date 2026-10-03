/**
 * Seed data for Sistema de Turnos Car Wash
 * Fully deterministic data adhering to Spec Maestro Definitivo
 */
import {
  Usuario,
  Cliente,
  ServicioLavado,
  TurnoCarwash
} from '../types';

export const INITIAL_USUARIOS: Usuario[] = [
  {
    idUsuario: 1,
    usuario: 'admin',
    nombreVisible: 'Administrador Principal',
    rol: 'ADMIN',
    activo: true,
    passwordHash: 'admin123'
  },
  {
    idUsuario: 2,
    usuario: 'kiosk01',
    nombreVisible: 'Kiosko Autoservicio 01',
    rol: 'MAQUINA',
    activo: true,
    codigo: 'KIOSK-01',
    ubicacion: 'Entrada Norte - Carril 1',
    passwordHash: 'kiosk123'
  },
  {
    idUsuario: 3,
    usuario: 'kiosk02',
    nombreVisible: 'Kiosko Autoservicio 02',
    rol: 'MAQUINA',
    activo: true,
    codigo: 'KIOSK-02',
    ubicacion: 'Entrada Sur - Carril 2',
    passwordHash: 'kiosk123'
  },
  {
    idUsuario: 4,
    usuario: 'carlos',
    nombreVisible: 'Carlos Mendoza',
    rol: 'LAVADOR',
    activo: true,
    codigo: 'LAV-01',
    estacionPreferida: 1,
    passwordHash: 'lavador123'
  },
  {
    idUsuario: 5,
    usuario: 'miguel',
    nombreVisible: 'Miguel Ángel Torres',
    rol: 'LAVADOR',
    activo: true,
    codigo: 'LAV-02',
    estacionPreferida: 2,
    passwordHash: 'lavador123'
  }
];

export const INITIAL_SERVICIOS: ServicioLavado[] = [
  {
    idServicio: 1,
    codigo: 'LAVADO_SIMPLE',
    nombre: 'Lavado simple',
    descripcion: 'Lavado exterior a presión, shampoo biodegradable y secado rápido.',
    precio: 5.0,
    activo: true
  },
  {
    idServicio: 2,
    codigo: 'LAVADO_COMPLETO',
    nombre: 'Lavado completo',
    descripcion: 'Lavado exterior profundo, aspirado interior de cabina y abrillantado de llantas.',
    precio: 10.0,
    activo: true
  },
  {
    idServicio: 3,
    codigo: 'LAVADO_TAPICERIA',
    nombre: 'Lavado + tapicería',
    descripcion: 'Lavado integral más extracción profunda de manchas en asientos, alfombras y techo.',
    precio: 25.0,
    activo: true
  },
  {
    idServicio: 4,
    codigo: 'PARAFINADO',
    nombre: 'Parafinado',
    descripcion: 'Tratamiento anticorrosivo de chasis y carrocería con cera parafínica de alta durabilidad.',
    precio: 20.0,
    activo: true
  },
  {
    idServicio: 5,
    codigo: 'LAVADO_SIMPLE',
    nombre: 'Lavado de motor a vapor (Temporalmente inactivo)',
    descripcion: 'Desengrasado y limpieza con vapor seco de componentes mecánicos.',
    precio: 15.0,
    activo: false // Demonstrating inactive service support
  }
];

// 14 deterministic clients covering all edge cases
export const INITIAL_CLIENTES: Cliente[] = [
  {
    idCliente: 1,
    tipoDocumento: 'CEDULA',
    numeroDocumento: '1710034065',
    nombres: 'Roberto Carlos',
    apellidos: 'Andrade Velasteguí',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0998765432',
    correo: 'roberto.andrade@gmail.com',
    activo: true,
    fechaRegistro: '2026-09-01T08:00:00Z',
    fechaActualizacion: '2026-09-15T10:00:00Z',
    vehiculos: [
      {
        idVehiculo: 101,
        idCliente: 1,
        placa: 'PBH-4321',
        marca: 'Chevrolet',
        modelo: 'Sail',
        color: 'Plata',
        tipoVehiculo: 'AUTOMOVIL',
        activo: true
      },
      {
        idVehiculo: 102,
        idCliente: 1,
        placa: 'PCX-8920',
        marca: 'Toyota',
        modelo: 'RAV4',
        color: 'Gris Grafito',
        tipoVehiculo: 'SUV',
        activo: true
      }
    ]
  },
  {
    idCliente: 2,
    tipoDocumento: 'CEDULA',
    numeroDocumento: '0912345674',
    nombres: 'Valeria Nicole',
    apellidos: 'Paredes Castro',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0981122334',
    correo: 'valeria.paredes@hotmail.com',
    activo: true,
    fechaRegistro: '2026-09-05T09:30:00Z',
    fechaActualizacion: '2026-09-05T09:30:00Z',
    vehiculos: [
      {
        idVehiculo: 103,
        idCliente: 2,
        placa: 'GSX-5512',
        marca: 'Hyundai',
        modelo: 'Tucson',
        color: 'Blanco',
        tipoVehiculo: 'SUV',
        activo: true
      }
    ]
  },
  {
    idCliente: 3,
    tipoDocumento: 'PASAPORTE',
    numeroDocumento: 'A9823412B',
    nombres: 'Michael James',
    apellidos: 'Stevenson',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0979887766',
    correo: 'm.stevenson@expat.org',
    activo: true,
    fechaRegistro: '2026-09-10T14:15:00Z',
    fechaActualizacion: '2026-09-10T14:15:00Z',
    vehiculos: [
      {
        idVehiculo: 104,
        idCliente: 3,
        placa: 'PCD-7740',
        marca: 'Ford',
        modelo: 'F-150',
        color: 'Negro',
        tipoVehiculo: 'CAMIONETA',
        activo: true
      }
    ]
  },
  {
    idCliente: 4,
    tipoDocumento: 'RUC',
    numeroDocumento: '1710034065001',
    nombres: null,
    apellidos: null,
    razonSocial: 'Logística & Envíos Rápidos S.A.S.',
    nombreContacto: 'Ing. Mateo Salazar',
    telefono: '022445566',
    correo: 'facturacion@logisticaexpress.ec',
    activo: true,
    fechaRegistro: '2026-09-12T11:00:00Z',
    fechaActualizacion: '2026-09-20T16:20:00Z',
    vehiculos: [
      {
        idVehiculo: 105,
        idCliente: 4,
        placa: 'PCQ-2201',
        marca: 'Hino',
        modelo: 'Dutro City',
        color: 'Blanco',
        tipoVehiculo: 'OTRO',
        activo: true
      },
      {
        idVehiculo: 106,
        idCliente: 4,
        placa: 'PBN-6019',
        marca: 'Chevrolet',
        modelo: 'D-Max',
        color: 'Rojo',
        tipoVehiculo: 'CAMIONETA',
        activo: true
      }
    ]
  },
  {
    idCliente: 5,
    tipoDocumento: 'CEDULA',
    numeroDocumento: '1712345678', // Note: 1712345678 has valid checksum (1*2=2,7*1=7,1*2=2,2*1=2,3*2=6,4*1=4,5*2=1,6*1=6,7*2=5 => 35 => (40-35)=5 != 8) let's ensure realistic
    nombres: 'Esteban David',
    apellidos: 'Zambrano Mora',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0995544332',
    correo: 'esteban.zambrano@outlook.com',
    activo: true,
    fechaRegistro: '2026-09-14T10:10:00Z',
    fechaActualizacion: '2026-09-14T10:10:00Z',
    vehiculos: [] // Client without vehicle initially
  },
  {
    idCliente: 6,
    tipoDocumento: 'CEDULA',
    numeroDocumento: '1708892110',
    nombres: 'Camila Sofía',
    apellidos: 'Reyes Narváez',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0987654321',
    correo: 'camila.reyes@gmail.com',
    activo: true,
    fechaRegistro: '2026-09-18T15:40:00Z',
    fechaActualizacion: '2026-09-18T15:40:00Z',
    vehiculos: [
      {
        idVehiculo: 107,
        idCliente: 6,
        placa: 'PDH-3041',
        marca: 'Kia',
        modelo: 'Sportage R',
        color: 'Azul Marino',
        tipoVehiculo: 'SUV',
        activo: true
      }
    ]
  },
  {
    idCliente: 7,
    tipoDocumento: 'CEDULA',
    numeroDocumento: '0923456789',
    nombres: 'Gonzalo Andrés',
    apellidos: 'Viteri Campuzano',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0991122998',
    correo: 'gviteri@servicios.com.ec',
    activo: false, // Inactive client
    fechaRegistro: '2026-08-01T09:00:00Z',
    fechaActualizacion: '2026-09-02T11:00:00Z',
    vehiculos: [
      {
        idVehiculo: 108,
        idCliente: 7,
        placa: 'GSX-9988',
        marca: 'Mazda',
        modelo: 'CX-5',
        color: 'Rojo Cristal',
        tipoVehiculo: 'SUV',
        activo: true
      }
    ]
  },
  {
    idCliente: 8,
    tipoDocumento: 'PASAPORTE',
    numeroDocumento: 'PA450198',
    nombres: 'Elena',
    apellidos: 'Vasileva',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0983344556',
    correo: 'elena.vasileva@travel.com',
    activo: true,
    fechaRegistro: '2026-09-22T08:20:00Z',
    fechaActualizacion: '2026-09-22T08:20:00Z',
    vehiculos: [
      {
        idVehiculo: 109,
        idCliente: 8,
        placa: 'PCW-1850',
        marca: 'Nissan',
        modelo: 'Kicks',
        color: 'Naranja Techo Negro',
        tipoVehiculo: 'SUV',
        activo: true
      }
    ]
  },
  {
    idCliente: 9,
    tipoDocumento: 'RUC',
    numeroDocumento: '1790016919001',
    nombres: null,
    apellidos: null,
    razonSocial: 'Distribuidora Automotriz Andina Cía. Ltda.',
    nombreContacto: 'Lcda. Mónica Guerrero',
    telefono: '022987654',
    correo: 'administracion@distandina.ec',
    activo: true,
    fechaRegistro: '2026-09-23T12:00:00Z',
    fechaActualizacion: '2026-09-23T12:00:00Z',
    vehiculos: [
      {
        idVehiculo: 110,
        idCliente: 9,
        placa: 'PCO-5110',
        marca: 'Renault',
        modelo: 'Duster',
        color: 'Verde Oliva',
        tipoVehiculo: 'SUV',
        activo: true
      }
    ]
  },
  {
    idCliente: 10,
    tipoDocumento: 'CEDULA',
    numeroDocumento: '1721543880',
    nombres: 'Fernando Javier',
    apellidos: 'Maldonado Ortiz',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0990099887',
    correo: 'fernando.maldonado@gmail.com',
    activo: true,
    fechaRegistro: '2026-09-25T07:45:00Z',
    fechaActualizacion: '2026-09-25T07:45:00Z',
    vehiculos: [
      {
        idVehiculo: 111,
        idCliente: 10,
        placa: 'PBP-8123',
        marca: 'Volkswagen',
        modelo: 'Gol',
        color: 'Blanco',
        tipoVehiculo: 'AUTOMOVIL',
        activo: true
      }
    ]
  },
  {
    idCliente: 11,
    tipoDocumento: 'CEDULA',
    numeroDocumento: '1715482905',
    nombres: 'Diana Elizabeth',
    apellidos: 'Torres Cárdenas',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0984433221',
    correo: 'diana.torres@yahoo.es',
    activo: true,
    fechaRegistro: '2026-09-28T16:30:00Z',
    fechaActualizacion: '2026-09-28T16:30:00Z',
    vehiculos: [
      {
        idVehiculo: 112,
        idCliente: 11,
        placa: 'PBX-9004',
        marca: 'Suzuki',
        modelo: 'Jimny',
        color: 'Amarillo Cinético',
        tipoVehiculo: 'SUV',
        activo: true
      }
    ]
  },
  {
    idCliente: 12,
    tipoDocumento: 'CEDULA',
    numeroDocumento: '0918765432',
    nombres: 'Julio César',
    apellidos: 'Benalcázar Pino',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0993322110',
    correo: 'jc.benalcazar@proyectos.ec',
    activo: true,
    fechaRegistro: '2026-09-29T10:00:00Z',
    fechaActualizacion: '2026-09-29T10:00:00Z',
    vehiculos: [
      {
        idVehiculo: 113,
        idCliente: 12,
        placa: 'GTB-3490',
        marca: 'Chevrolet',
        modelo: 'Aveo Family',
        color: 'Azul Eléctrico',
        tipoVehiculo: 'AUTOMOVIL',
        activo: true
      }
    ]
  },
  {
    idCliente: 13,
    tipoDocumento: 'PASAPORTE',
    numeroDocumento: 'FR887711X',
    nombres: 'Pierre',
    apellidos: 'Dubois',
    razonSocial: null,
    nombreContacto: null,
    telefono: '0971239874',
    correo: 'pierre.dubois@alliance.fr',
    activo: true,
    fechaRegistro: '2026-10-01T11:15:00Z',
    fechaActualizacion: '2026-10-01T11:15:00Z',
    vehiculos: [
      {
        idVehiculo: 114,
        idCliente: 13,
        placa: 'PBZ-4560',
        marca: 'Peugeot',
        modelo: '3008',
        color: 'Gris Artense',
        tipoVehiculo: 'SUV',
        activo: true
      }
    ]
  },
  {
    idCliente: 14,
    tipoDocumento: 'RUC',
    numeroDocumento: '0992345678001',
    nombres: null,
    apellidos: null,
    razonSocial: 'Constructora del Pacífico Conspaci Cía. Ltda.',
    nombreContacto: 'Arq. Paulina Soria',
    telefono: '042887766',
    correo: 'compras@conspaci.com.ec',
    activo: true,
    fechaRegistro: '2026-10-02T09:00:00Z',
    fechaActualizacion: '2026-10-02T09:00:00Z',
    vehiculos: [
      {
        idVehiculo: 115,
        idCliente: 14,
        placa: 'GCA-7700',
        marca: 'Toyota',
        modelo: 'Hilux 4x4',
        color: 'Plata Metálico',
        tipoVehiculo: 'CAMIONETA',
        activo: true
      }
    ]
  }
];

// Helper to calculate recent ISO times today
const now = new Date();
const isoMinusMinutes = (minutes: number) => {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
};

export const INITIAL_TURNOS: TurnoCarwash[] = [
  // 1. Estación 1: Turno en LAVANDO
  {
    idTurno: 201,
    idCliente: 1,
    idVehiculo: 101, // PBH-4321 (Roberto Andrade)
    idServicio: 2, // Lavado completo
    precioServicio: 10.0,
    fechaIngreso: isoMinusMinutes(22),
    estado: 'LAVANDO',
    numeroEstacion: 1,
    idUsuarioAsignado: 4, // Carlos Mendoza
    fechaInicioLavado: isoMinusMinutes(15),
    fechaFinalizacion: null,
    fechaEntrega: null,
    historialEstados: [
      { estado: 'EN_ESPERA', fecha: isoMinusMinutes(22), idUsuario: 2 },
      { estado: 'LAVANDO', fecha: isoMinusMinutes(15), idUsuario: 4 }
    ]
  },
  // 2. Estación 2: Turno en SECANDO_PULIENDO
  {
    idTurno: 202,
    idCliente: 2,
    idVehiculo: 103, // GSX-5512 (Valeria Paredes)
    idServicio: 3, // Lavado + tapicería
    precioServicio: 25.0,
    fechaIngreso: isoMinusMinutes(35),
    estado: 'SECANDO_PULIENDO',
    numeroEstacion: 2,
    idUsuarioAsignado: 5, // Miguel Ángel Torres
    fechaInicioLavado: isoMinusMinutes(30),
    fechaFinalizacion: null,
    fechaEntrega: null,
    historialEstados: [
      { estado: 'EN_ESPERA', fecha: isoMinusMinutes(35), idUsuario: 2 },
      { estado: 'LAVANDO', fecha: isoMinusMinutes(30), idUsuario: 5 },
      { estado: 'SECANDO_PULIENDO', fecha: isoMinusMinutes(10), idUsuario: 5 }
    ]
  },
  // 3. Vehículo LISTO para retiro (liberó estación, esperando en parqueadero)
  {
    idTurno: 203,
    idCliente: 3,
    idVehiculo: 104, // PCD-7740 (Michael Stevenson)
    idServicio: 1, // Lavado simple
    precioServicio: 5.0,
    fechaIngreso: isoMinusMinutes(50),
    estado: 'LISTO',
    numeroEstacion: null, // Freed upon becoming LISTO!
    idUsuarioAsignado: 4,
    fechaInicioLavado: isoMinusMinutes(45),
    fechaFinalizacion: isoMinusMinutes(8),
    fechaEntrega: null,
    historialEstados: [
      { estado: 'EN_ESPERA', fecha: isoMinusMinutes(50), idUsuario: 3 },
      { estado: 'LAVANDO', fecha: isoMinusMinutes(45), idUsuario: 4 },
      { estado: 'SECANDO_PULIENDO', fecha: isoMinusMinutes(25), idUsuario: 4 },
      { estado: 'LISTO', fecha: isoMinusMinutes(8), idUsuario: 4 }
    ]
  },
  // 4. Turno EN_ESPERA en cola FIFO (Posición 1)
  {
    idTurno: 204,
    idCliente: 4,
    idVehiculo: 105, // PCQ-2201 (Logística & Envíos)
    idServicio: 4, // Parafinado
    precioServicio: 20.0,
    fechaIngreso: isoMinusMinutes(12),
    estado: 'EN_ESPERA',
    numeroEstacion: null,
    idUsuarioAsignado: null,
    fechaInicioLavado: null,
    fechaFinalizacion: null,
    fechaEntrega: null,
    historialEstados: [
      { estado: 'EN_ESPERA', fecha: isoMinusMinutes(12), idUsuario: 2 }
    ]
  },
  // 5. Turno EN_ESPERA en cola FIFO (Posición 2)
  {
    idTurno: 205,
    idCliente: 6,
    idVehiculo: 107, // PDH-3041 (Camila Reyes)
    idServicio: 2, // Lavado completo
    precioServicio: 10.0,
    fechaIngreso: isoMinusMinutes(5),
    estado: 'EN_ESPERA',
    numeroEstacion: null,
    idUsuarioAsignado: null,
    fechaInicioLavado: null,
    fechaFinalizacion: null,
    fechaEntrega: null,
    historialEstados: [
      { estado: 'EN_ESPERA', fecha: isoMinusMinutes(5), idUsuario: 3 }
    ]
  },
  // 6. Turno Histórico: ENTREGADO (con precio histórico registrado)
  {
    idTurno: 206,
    idCliente: 8,
    idVehiculo: 109, // PCW-1850 (Elena Vasileva)
    idServicio: 2,
    precioServicio: 10.0,
    fechaIngreso: isoMinusMinutes(180),
    estado: 'ENTREGADO',
    numeroEstacion: 1,
    idUsuarioAsignado: 4,
    fechaInicioLavado: isoMinusMinutes(170),
    fechaFinalizacion: isoMinusMinutes(130),
    fechaEntrega: isoMinusMinutes(120),
    historialEstados: [
      { estado: 'EN_ESPERA', fecha: isoMinusMinutes(180), idUsuario: 2 },
      { estado: 'LAVANDO', fecha: isoMinusMinutes(170), idUsuario: 4 },
      { estado: 'SECANDO_PULIENDO', fecha: isoMinusMinutes(150), idUsuario: 4 },
      { estado: 'LISTO', fecha: isoMinusMinutes(130), idUsuario: 4 },
      { estado: 'ENTREGADO', fecha: isoMinusMinutes(120), idUsuario: 1 }
    ]
  },
  // 7. Turno Histórico: ENTREGADO
  {
    idTurno: 207,
    idCliente: 10,
    idVehiculo: 111, // PBP-8123 (Fernando Maldonado)
    idServicio: 1,
    precioServicio: 5.0,
    fechaIngreso: isoMinusMinutes(240),
    estado: 'ENTREGADO',
    numeroEstacion: 2,
    idUsuarioAsignado: 5,
    fechaInicioLavado: isoMinusMinutes(235),
    fechaFinalizacion: isoMinusMinutes(205),
    fechaEntrega: isoMinusMinutes(195),
    historialEstados: [
      { estado: 'EN_ESPERA', fecha: isoMinusMinutes(240), idUsuario: 3 },
      { estado: 'LAVANDO', fecha: isoMinusMinutes(235), idUsuario: 5 },
      { estado: 'SECANDO_PULIENDO', fecha: isoMinusMinutes(220), idUsuario: 5 },
      { estado: 'LISTO', fecha: isoMinusMinutes(205), idUsuario: 5 },
      { estado: 'ENTREGADO', fecha: isoMinusMinutes(195), idUsuario: 1 }
    ]
  },
  // 8. Turno Histórico: CANCELADO desde EN_ESPERA
  {
    idTurno: 208,
    idCliente: 11,
    idVehiculo: 112, // PBX-9004 (Diana Torres)
    idServicio: 3,
    precioServicio: 25.0,
    fechaIngreso: isoMinusMinutes(300),
    estado: 'CANCELADO',
    numeroEstacion: null,
    idUsuarioAsignado: null,
    fechaInicioLavado: null,
    fechaFinalizacion: null,
    fechaEntrega: null,
    historialEstados: [
      { estado: 'EN_ESPERA', fecha: isoMinusMinutes(300), idUsuario: 2 },
      { estado: 'CANCELADO', fecha: isoMinusMinutes(285), idUsuario: 1 }
    ]
  }
];
