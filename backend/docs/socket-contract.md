# Contrato Socket.IO — emisión de tickets

Socket.IO se usa **solo** para avisar que se emitió un ticket con `POST /api/tickets/emision`.
Los tickets se crean únicamente por HTTP. El resto de la API (clientes, vehículos, servicios,
usuarios, turnos y consulta de placas) es REST y no emite eventos.

| Elemento | Valor |
|---|---|
| Servidor | mismo host y puerto que HTTP (`PORT`, por defecto 3001) |
| Namespace | `/tickets-emision` |
| Path de transporte | `/socket.io` (el prefijo HTTP `/api` no lo afecta) |
| Transporte | `websocket` únicamente |
| Origen | el header `Origin` debe estar en `FRONTEND_URL` (se valida en el upgrade y en el middleware) |
| Autenticación | `auth: { token: accessToken }` en el handshake |
| Administrador | además `auth: { machineId: '<UUID de una máquina activa>' }` |
| Room | `machine:<machineId>`, asignada por el servidor |
| Evento servidor → cliente | `emision:ready` y `ticket:emitido` |
| Eventos cliente → servidor | ninguno |

## Handshake

1. Se valida `Origin`. Si no está permitido, el upgrade se rechaza.
2. Se valida el access token: firma, expiración y `typ === 'access'`. Un refresh token se rechaza.
3. Se consulta en base de datos que el usuario siga activo.
4. Se decide la room:
   - **MAQUINA**: siempre `machine:<su propio id>`. Si el cliente envía un `machineId`, se ignora.
   - **ADMIN**: el `machineId` del handshake debe ser una máquina activa.
   - **LAVADOR** y cualquier otro rol: se rechazan.
5. El socket se une a la room y recibe `emision:ready`.
6. Cuando expira el access token, el servidor desconecta el socket. El cliente renueva el token
   con `POST /api/auth/refresh`, actualiza `socket.auth` y vuelve a conectar.

Errores del handshake (`connect_error`, en `err.message` y `err.data.code`):
`ORIGIN_NOT_ALLOWED`, `UNAUTHORIZED`, `FORBIDDEN`, `MACHINE_NOT_AUTHORIZED`.
Cuando el upgrade se rechaza por `Origin`, el cliente puede recibir un error de transporte
genérico en lugar del código.

## Eventos

### `emision:ready`

Confirma que la conexión está lista para recibir tickets. No indica nada sobre otros procesos.

```json
{ "machineId": "UUID-maquina" }
```

### `ticket:emitido`

Se emite **después del commit**, solo a `machine:<machineId>` del ticket. Nunca se envía a todos
los sockets, porque el ticket contiene datos personales.

```json
{
  "eventId": "UUID",
  "requestId": "Idempotency-Key de la emisión",
  "occurredAt": "2026-10-03T19:00:00.000Z",
  "ticket": { "...": "exactamente el objeto data de POST /api/tickets/emision" }
}
```

## Garantías

- La fuente de verdad es la respuesta HTTP y el ticket guardado. El evento **no tiene entrega
  garantizada** y no hay "exactamente una vez" entre la base de datos y el socket.
- Un reintento HTTP con la misma `Idempotency-Key` y el mismo body devuelve el ticket existente
  (HTTP 200, `meta.replayed: true`) y **no** genera un evento nuevo.
- Si hubo rollback o falló una validación, no se emite ningún evento.
- Si falla la notificación, el ticket no se revierte y la respuesta HTTP sigue siendo exitosa.
- Al reconectar no se reenvían eventos antiguos.
- HTTP y WebSocket pueden llegar en cualquier orden: el frontend debe deduplicar por `ticketId`.

## Despliegue

Esta referencia cubre una sola instancia. Con varias instancias hace falta un adapter
compartido de Socket.IO (por ejemplo Redis) para que las rooms y los eventos lleguen a todas.
Si hay un proxy inverso, debe permitir el upgrade WebSocket en `/socket.io`.
