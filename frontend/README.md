# Sistema de Turnos Car Wash

Sistema web integral y responsive de gestión de turnos inmediatos para lavados de autos, desarrollado en **React 19 + TypeScript + Vite + Tailwind CSS**.

## Ejecución con el backend

Los datos se guardan en PostgreSQL a través del backend de [`../backend`](../backend/README.md).
No hay persistencia en `localStorage`.

1. Levanta el backend en el puerto 3001: `cd ../backend` y luego `npm run start:dev`.
2. Levanta el frontend: `npm run dev` (puerto 3000).

En desarrollo, Vite reenvía `/api` y `/socket.io` a `http://localhost:3001` (ver `vite.config.ts`).
Así el navegador trabaja en un solo origen y la cookie de sesión funciona sin configurar CORS.
Para otro backend, define `BACKEND_URL` al iniciar Vite. Para un build servido desde otro
dominio, define `VITE_API_URL`.

## Arquitectura y Estructura

- **`src/types/`**: Modelos de datos de dominio (`TurnoCarwash`, `Cliente`, `Vehiculo`, `Usuario`, `ServicioLavado`). Los IDs son UUID del backend.
- **`src/services/`**:
  - `api.ts`: Cliente HTTP. Guarda el access token solo en memoria y renueva la sesión con la cookie de refresh.
  - `mappers.ts`: Conversión entre los DTOs del backend y los tipos del frontend.
  - `turnosService.ts`: Emisión de tickets (con `Idempotency-Key`) y operación de turnos. El despacho FIFO a las estaciones lo hace el backend.
  - `clientesService.ts`: Búsqueda por documento, CRUD paginado y registro de vehículos.
  - `usuariosService.ts`: Gestión de terminales y lavadores (el backend aplica la regla de administrador único).
  - `serviciosLavadoService.ts`: Catálogo de servicios y precios en dólares (USD).
  - `antService.ts`: Botón «Validar» de la placa (`GET /api/vehicles/lookup`).
- **`src/context/`**:
  - `AuthContext.tsx`: Login contra la API; la sesión se restaura al recargar la página.
  - `CarWashContext.tsx`: Turnos, servicios y kioscos sincronizados con el backend (se refrescan cada 5 s), con notificaciones toast.
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
