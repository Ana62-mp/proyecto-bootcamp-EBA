# Sistema de Turnos Car Wash

Sistema web integral y responsive de gestión de turnos inmediatos para lavados de autos, desarrollado en **React 19 + TypeScript + Vite + Tailwind CSS**.

## Arquitectura y Estructura

- **`src/types/`**: Modelos de datos de dominio (`TurnoCarwash`, `Cliente`, `Vehiculo`, `Usuario`, `ServicioLavado`).
- **`src/services/`**:
  - `storage.ts`: Capa de persistencia aislada en `localStorage` (sin acceso directo desde componentes).
  - `turnAssignmentService.ts`: Despachador central FIFO que asigna automáticamente vehículos a Estación 1 y Estación 2.
  - `turnosService.ts`: Máquina de estados (`EN_ESPERA` → `LAVANDO` → `SECANDO_PULIENDO` → `LISTO` → `ENTREGADO`).
  - `clientesService.ts`: CRUD, búsqueda con debounce, paginación y validaciones.
  - `usuariosService.ts`: Regla de administrador único y gestión de terminales y lavadores.
  - `serviciosLavadoService.ts`: Catálogo de servicios y precios en dólares (USD).
- **`src/context/`**:
  - `AuthContext.tsx`: Gestión de sesión, roles y accesos rápidos de prueba.
  - `CarWashContext.tsx`: Estado reactivo centralizado con notificaciones toast y propagación de eventos.
- **`src/utils/`**:
  - `documentValidators.ts`: Algoritmo de validación de Cédula ecuatoriana (módulo 10), Pasaporte internacional y RUC (13 dígitos terminado en 001).
  - `formatters.ts`: Formato de moneda `Intl.NumberFormat('es-EC')`, fechas y badges de estado.
- **`src/components/`**:
  - `common/`: Logo oficial de Car Wash, Badge de estados, Modal accesible, Paginación con elipsis, Comprobante térmico de 80mm y advertencia de inactividad de 60s.
  - `layout/`: AppLayout con sidebar colapsable en hover para Admin/Lavador, KioskLayout siempre expandido para Máquinas, TopBar con métricas operativas y RoleGuard.
  - `kiosk/`: Asistente por pasos para autoservicio de clientes y vehículos.
  - `stations/`: Tarjetas de Estación 1 y 2 con estados Disponible / Ocupado y avance de etapas.
  - `admin/`: Modales de inspección, edición y alta de clientes y usuarios.
- **`src/pages/`**:
  - `/login`: Inicio de sesión con bloque colapsable de credenciales de prueba.
  - `/resumen`: Dashboard operativo con contadores, estaciones, cola FIFO y entregas.
  - `/turnos/nuevo`: Kiosko de turnos con validaciones y emisión de tickets.
  - `/turnos/cola`: Cola FIFO pública y privada.
  - `/estaciones`: Panel operativo para lavadores y administración.
  - `/monitor`: Pantalla pública para televisores con placas grandes y alto contraste.
  - `/historial`: Auditoría de turnos entregados y cancelados con precios históricos.
  - `/admin/clientes`: CRUD de clientes con paginación y filtros combinables.
  - `/admin/usuarios`: Administración de usuarios con protección de administrador único.

## Roles y Credenciales de Demostración

| Rol | Usuario | Contraseña | Acceso |
| --- | --- | --- | --- |
| **ADMIN** | `admin` | `admin123` | Acceso total a resumen, clientes, usuarios, historial, estaciones y kiosko |
| **MAQUINA** | `kiosk01` | `kiosk123` | Terminal autoservicio: Nuevo turno y Cola de espera (sin datos privados) |
| **MAQUINA** | `kiosk02` | `kiosk123` | Terminal autoservicio carril 2 |
| **LAVADOR** | `carlos` | `lavador123` | Operador Estación 1: Avance de etapas y cola operativa |
| **LAVADOR** | `miguel` | `lavador123` | Operador Estación 2 |

## Impresión de Comprobantes

El sistema formatea e imprime automáticamente tickets térmicos de 80 mm (`@media print`) conteniendo:
- Número de turno interno y fecha/hora.
- Identificación y datos del cliente.
- Placa destacada, marca, modelo, color y tipo de vehículo.
- Servicio y precio formal en USD.
- Estado `PENDIENTE` de pago.
- Mensaje obligatorio para pagar en caja y dirigirse al parqueadero.
