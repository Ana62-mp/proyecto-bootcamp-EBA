# Car Wash — Backend

API del sistema de turnos Car Wash, hecha con **NestJS 11, Prisma 7 y PostgreSQL**. Atiende al
frontend de [`../frontend`](../frontend). Se ejecuta directamente con Node.js y npm, sin
contenedores.

- La API es REST bajo `/api`. La documentación Swagger está en `http://localhost:3001/api/docs`.
- Socket.IO (namespace `/tickets-emision`) se usa **solo** para avisar que se emitió un ticket.
  Ver [docs/socket-contract.md](docs/socket-contract.md).
- La consulta de placas para el botón «Validar» busca primero en la base local y, si no
  encuentra la placa, consulta **webservices.ec**, un proveedor externo. No es una conexión
  directa con la ANT o el SRI.

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 22 LTS (≥ 22.12, ver `.nvmrc`) |
| npm | 10.x (el que trae Node 22) |
| PostgreSQL | 14 o superior, instalado localmente o remoto (probado con 18) |

## Puesta en marcha

### 1. Base de datos

Con un usuario administrador de PostgreSQL (por ejemplo desde `psql -U postgres`), cambiando las
contraseñas:

```sql
CREATE ROLE carwash_user WITH LOGIN PASSWORD 'cambiar_por_secreto_real' CREATEDB;
CREATE DATABASE carwash_db OWNER carwash_user;
CREATE DATABASE carwash_test OWNER carwash_user;  -- solo para las pruebas e2e
```

`CREATEDB` solo hace falta en desarrollo, porque `prisma migrate dev` crea una base temporal
(shadow). No se lo des al usuario de producción: en producción solo se usa `migrate deploy`.

### 2. Configuración

Copia `.env.example` a `.env` y completa los valores (en Windows puedes hacerlo desde el
Explorador o con `Copy-Item .env.example .env` en PowerShell). Lo mínimo es:

- `DATABASE_URL=postgresql://carwash_user:...@localhost:5432/carwash_db`
- `JWT_SECRET`: al menos 32 caracteres aleatorios.
- `FRONTEND_URL=http://localhost:3000`: origen del frontend de Vite.
- `WEBSERVICES_EC_TOKEN`: el token del proveedor. Si no lo tienes, pon
  `WEBSERVICES_EC_ENABLED=false`. La búsqueda local seguirá funcionando y las placas que no estén
  registradas devolverán `503 VEHICLE_PROVIDER_UNAVAILABLE`.

> El frontend usa el puerto **3000**, por eso la API escucha en el **3001** (`PORT`).

La configuración se valida al arrancar. Si falta una variable o tiene un valor inválido, el
proceso no inicia y muestra cuál es.

### 3. Instalar, migrar y cargar datos

```bash
npm ci
npx prisma generate
npx prisma migrate dev        # aplica prisma/migrations a la base de desarrollo
npx prisma db seed            # usuarios de prueba, servicios y clientes de demostración
```

### 4. Ejecutar

```bash
# Desarrollo
npm run start:dev
npx prisma studio             # explorar la base

# Producción
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:prod
```

En producción ejecuta el servicio con un usuario sin privilegios, detrás de HTTPS. Si hay un
proxy inverso, debe permitir el upgrade WebSocket en `/socket.io`.

### 5. Calidad

```bash
npm run lint
npm test                      # pruebas unitarias, sin base de datos
npm run test:e2e              # pruebas e2e contra la base de pruebas (ver abajo)
npm run build
```

Para las pruebas **e2e**, crea `backend/.env.test` con las mismas variables que `.env`, pero con
`DATABASE_URL` apuntando a una base cuyo nombre contenga `test` (por ejemplo `carwash_test`). La
suite se niega a correr contra cualquier otra base, porque **vacía las tablas** al empezar.
Aplica las migraciones por sí sola y desactiva el proveedor externo: nunca consume consultas
reales de webservices.ec.

## Usuarios de prueba (seed)

Son los mismos del frontend. Las contraseñas son solo para pruebas y el seed se niega a correr
con `NODE_ENV=production`.

| Rol | Usuario | Contraseña |
|---|---|---|
| ADMIN | `admin` | `admin123` |
| MAQUINA | `kiosk01`, `kiosk02` | `kiosk123` |
| LAVADOR | `carlos`, `miguel` | `lavador123` |

El seed también crea los 5 servicios (uno inactivo) y los 14 clientes con sus 15 vehículos de
`frontend/src/data/seedData.ts`. Las placas se guardan sin guion (`PBH4321`). Cuatro cédulas de
esos datos (`0912345674`, `1712345678`, `0923456789`, `0918765432`) no pasan el dígito
verificador. Se conservan tal cual para que coincidan con el frontend, pero el kiosko las
rechaza al buscar, igual que ya pasa en el frontend.

## Arquitectura

```
src/
  main.ts, setup-app.ts       bootstrap: prefijo /api, CORS, ValidationPipe, cookies, Socket.IO, Swagger
  context/config              validación del .env (class-validator)
  context/database            PrismaService con @prisma/adapter-pg
  context/websocket           adapter Socket.IO (path, transporte y Origin)
  common/                     guards (JWT global + roles), decoradores, filtro de errores, utilidades
  modules/<feature>/
    api/                      controladores, DTOs y el gateway (solo tickets)
    application/              casos de uso (.execute()) y servicios de aplicación
    domain/                   ports (interfaces), tipos y reglas puras
    infrastructure/           repositorios Prisma y adapters (bcrypt, JWT, webservices.ec, Socket.IO)
```

`application/` y `domain/` no importan Prisma, Express ni Socket.IO: dependen de ports que
`infrastructure/` implementa y que se inyectan por token. Por eso los casos de uso se prueban con
mocks, sin base de datos.

| Módulo | Responsabilidad |
|---|---|
| `auth` | login, refresh con rotación, logout, `me` |
| `usuarios` | administración de máquinas y lavadores; el administrador es único |
| `clientes` | búsqueda por documento (kiosko), CRUD, validación de cédula, RUC y pasaporte |
| `vehicles` | consulta por placa (§13), registro y edición de vehículos |
| `servicios` | catálogo y precios |
| `tickets` | emisión idempotente + WebSocket; operación de turnos por REST |

## Endpoints

Todas las rutas requieren `Authorization: Bearer <accessToken>`, salvo las marcadas como
públicas. La tabla completa, con ejemplos y errores, está en Swagger.

| Método y ruta | Roles | Uso en el frontend |
|---|---|---|
| `POST /api/auth/login` · `refresh` · `logout` | pública | LoginPage / AuthContext |
| `GET /api/auth/me` | todos | restaurar sesión |
| `GET /api/clientes/buscar?tipoDocumento=&numeroDocumento=` | ADMIN, MAQUINA | DocumentStep (`data: null` = cliente nuevo) |
| `POST /api/clientes` | ADMIN, MAQUINA | NewCustomerForm / ClientModal |
| `GET /api/clientes` · `GET/PATCH /api/clientes/:id` · `PATCH /:id/estado` | ADMIN | ClientesPage |
| `GET /api/vehicles/lookup?licensePlate=` | ADMIN, MAQUINA | botón «Validar» de VehicleForm |
| `POST /api/vehicles` · `GET /api/vehicles/:id` | ADMIN, MAQUINA | confirmar el vehículo antes de emitir |
| `PATCH /api/vehicles/:id` | ADMIN | editar o desactivar un vehículo |
| `GET /api/servicios` | todos | ServiceSelector |
| `POST /api/tickets/emision` | MAQUINA, ADMIN | TurnConfirmation (header `Idempotency-Key`) |
| `GET /api/tickets/:id` | MAQUINA (solo sus tickets), ADMIN | reimpresión |
| `GET /api/turnos/cola` | todos | ColaEsperaPage / MonitorPublicoPage (sin datos personales) |
| `GET /api/turnos/activos` | ADMIN, LAVADOR | EstacionesPage / ResumenPage |
| `POST /api/turnos/:id/avanzar` | ADMIN, LAVADOR | StationCard |
| `POST /api/turnos/:id/entregar` · `cancelar` | ADMIN | ResumenPage / ColaEsperaPage |
| `GET /api/turnos?estado=ENTREGADO,CANCELADO` | ADMIN | HistorialPage |
| `GET/POST/PATCH /api/usuarios…` | ADMIN | UsuariosPage |
| `GET /api/health` | pública | monitoreo |

Los errores siempre tienen la misma forma: `{ "error": { "code", "message", "details": [] } }`.
Los importes son `Decimal` serializados como texto (`"10.00"`) y las fechas son ISO 8601 en UTC;
el frontend las muestra en `America/Guayaquil`.

## Reglas de negocio trasladadas del frontend

- **Turnos**: el número es `CW-YYYYMMDD-NNNN`, con un contador atómico por día de
  `America/Guayaquil`. Se despachan en orden FIFO a las estaciones 1 y 2 al emitir, al pasar a
  `LISTO` y al cancelar. Los estados avanzan `EN_ESPERA → LAVANDO → SECANDO_PULIENDO → LISTO →
  ENTREGADO`. Solo se puede cancelar desde `EN_ESPERA`. Un vehículo no puede tener dos turnos
  activos.
- **Tickets**: el precio y los datos del comprobante salen de la base de datos y se guardan como
  copia. El estado de pago siempre es `PENDIENTE`: emitir un ticket no significa que esté pagado.
- **Usuarios**: hay un solo administrador; no se crea, degrada ni desactiva otro.
- **Clientes**: un cliente con un turno activo no se puede desactivar. Una placa registrada a
  otro cliente devuelve `409` y no se reasigna.

## Emisión de tickets: transacción e idempotencia

1. Se valida el actor. Una máquina siempre emite para sí misma; un administrador indica
   `machineId`, que debe ser una máquina activa.
2. Dentro de una transacción con `pg_advisory_xact_lock` se hace todo esto: comprobar la
   idempotencia `(actor, Idempotency-Key)`, validar cliente, vehículo y servicio, incrementar el
   contador del día con `INSERT … ON CONFLICT … RETURNING`, crear el ticket y su historial, y
   despachar a una estación.
3. **Solo después del commit** se emite `ticket:emitido` a `machine:<id>`. Si la notificación
   falla, se registra en el log y la respuesta HTTP sigue siendo `201`.
4. Un reintento con la misma clave y el mismo body devuelve `200` con `replayed: true` y no
   genera un evento nuevo. La misma clave con un body distinto devuelve `409
   IDEMPOTENCY_KEY_REUSED`. Las restricciones únicas cubren las carreras.

## Consulta de placas (§13)

- `GET /api/vehicles/lookup?licensePlate=PBH1234` acepta `ABC1234`, `ABC-1234`, `IA7000` e
  `IA-7000`. La placa canónica no lleva guion. A webservices.ec se le envía `IA-7000` cuando la
  placa tiene dos letras.
- Si la placa está en la base local, responde `source: LOCAL` sin consultar al proveedor. Si no,
  consulta webservices.ec y responde `source: WEBSERVICES_EC` con `vehicleId: null`. La consulta
  **no crea** vehículos, clientes ni tickets.
- Se devuelven los 14 campos del proveedor con nombres estables. Los campos que faltan van como
  `null` y se listan en `meta.missingFields`.
- Al confirmar con `POST /api/vehicles`, si el backend consultó esa placa en las últimas
  `VEHICLE_LOOKUP_SNAPSHOT_TTL_HOURS` horas, el vehículo se guarda con `dataSource:
  WEBSERVICES_EC` y los datos del proveedor (matrícula, caducidad, chasis, motor). La procedencia
  nunca se toma del frontend. Un registro manual queda como `MANUAL`.
- Hay un límite de consultas por actor (`VEHICLE_LOOKUP_RATE_LIMIT_PER_MINUTE`, se guarda en
  memoria). El timeout es de 8 s y no hay reintentos automáticos. El token nunca se registra en
  los logs ni se envía al frontend.
- Códigos de error: `400 INVALID_LICENSE_PLATE`, `404 VEHICLE_NOT_FOUND`, `429
  LOOKUP_RATE_LIMITED`, `502 VEHICLE_PROVIDER_INVALID_RESPONSE`, `503
  VEHICLE_PROVIDER_UNAVAILABLE` (cuota, caída o credencial del proveedor rechazada) y `504
  VEHICLE_PROVIDER_TIMEOUT`.

**Pendiente de confirmar con el proveedor.** El adapter se escribió a partir del contrato y la
respuesta de ejemplo que se aportaron. No se hizo ninguna consulta autenticada real. Antes de
usarlo en producción hay que confirmar con una prueba autorizada tres cosas: cómo indica
webservices.ec que una placa no existe (hoy se interpreta un HTTP 404 o `status:false` con un
mensaje explícito), si la variante de dos letras con guion es correcta y en qué formato devuelve
las fechas. Las pruebas automatizadas usan mocks. **El token que se compartió en el chat quedó
expuesto y debe reemplazarse.**

## Seguridad

- Las contraseñas se guardan con bcrypt (detrás de `HasherPort`). Nunca se registran en los logs
  ni el hash ni la contraseña.
- El access token va en el body de la respuesta y el frontend lo guarda en memoria. El refresh
  token va solo en una cookie `httpOnly` + `SameSite`, y `Secure` en producción. Ambos se firman
  con `JWT_SECRET` y se distinguen por el claim `typ`.
- `/auth/refresh` rota los dos tokens, comprueba que el usuario siga activo y valida `Origin`.
  Esta variante no detecta que se reutilice un refresh anterior. Si se necesita, hay que guardar
  el hash de cada sesión de refresh e invalidarlo al usarlo.
- El guard JWT es global: toda ruta requiere token salvo las marcadas con `@Public()`. Además se
  aplica control por roles.
- El handshake de Socket.IO se autentica por separado: token de acceso, usuario activo,
  `Origin` permitido y room asignada por el servidor.
- El límite del body JSON es 100 kB. El `ValidationPipe` usa `whitelist` y
  `forbidNonWhitelisted`. Los errores inesperados devuelven `500 INTERNAL_ERROR`, sin stack trace.

## Integración con el frontend

El frontend actual guarda todo en `localStorage`. Para conectarlo a esta API hay ejemplos
tipados en [docs/frontend-integration/](docs/frontend-integration/):

- `tickets-emision.client.ts`: conexión Socket.IO, espera de `emision:ready` con tiempo máximo,
  `Idempotency-Key`, deduplicación por `ticketId`, reconexión al renovar el token y limpieza de
  listeners.
- `vehicle-lookup.client.ts`: botón «Validar» con cancelación de consultas atrasadas y los
  mensajes de §13.7. Sustituye la simulación de `frontend/src/services/antService.ts`.

## Limitaciones conocidas

- Está pensado para **una sola instancia**. Con varias habría que agregar un adapter compartido de
  Socket.IO (Redis) y mover el límite de consultas a un almacén compartido.
- Los eventos de Socket.IO no tienen entrega garantizada. Para eso haría falta un outbox, que
  queda fuera de este alcance.
- La consulta por chasis (VIN) no está implementada; la placa es el único criterio.
