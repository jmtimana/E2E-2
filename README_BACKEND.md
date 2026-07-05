# Uber Clone Backend — CS2031 DBP 2026-1

Backend minimalista de un clon de Uber para practicar la integración E2E con un frontend React + TypeScript.

## Levantar el servidor

```bash
./mvnw spring-boot:run
```

- Puerto: `http://localhost:8080`
- Base de datos: H2 in-memory (se reinicia con el servidor)
- Sin variables de entorno requeridas

## Herramientas de exploración

| Herramienta | URL |
|-------------|-----|
| **Swagger UI** (explorar y probar endpoints) | http://localhost:8080/swagger-ui.html |
| **H2 Console** (ver tablas y datos) | http://localhost:8080/h2-console |

> H2 Console: JDBC URL `jdbc:h2:mem:labdb` · User `sa` · Password (vacío)

## Usuarios de prueba (seed data)

Al arrancar, el backend carga automáticamente estos usuarios:

| Email | Password | Rol | Estado |
|-------|----------|-----|--------|
| `carlos@uber.com` | `pass123` | DRIVER | disponible, rating 4.8 |
| `lucia@uber.com` | `pass123` | DRIVER | ocupado (viaje activo) |
| `pedro@uber.com` | `pass123` | DRIVER | disponible, rating 3.9 |
| `ana@uber.com` | `pass123` | PASSENGER | — |
| `mario@uber.com` | `pass123` | PASSENGER | — |
| `sofia@uber.com` | `pass123` | PASSENGER | — |

También hay 3 viajes precargados: uno COMPLETED (calificado), uno IN_PROGRESS y uno PENDING.

---

## Autenticación

Todos los endpoints (excepto `/auth/**`) requieren un **Bearer Token** en el header:

```
Authorization: Bearer <token>
```

El token se obtiene al registrarse o hacer login.

---

## Endpoints

### Auth — público

#### `POST /auth/register`
Crea un nuevo usuario y devuelve un JWT.

**Body:**
```json
{
  "firstName": "string (requerido)",
  "lastName": "string (requerido)",
  "email": "string, formato email (requerido)",
  "password": "string, mínimo 6 caracteres (requerido)",
  "role": "PASSENGER | DRIVER (requerido)"
}
```

**Respuesta 200:**
```json
{ "token": "eyJhbGci..." }
```

---

#### `POST /auth/login`
Autentica un usuario existente y devuelve un JWT.

**Body:**
```json
{
  "email": "string (requerido)",
  "password": "string (requerido)"
}
```

**Respuesta 200:**
```json
{ "token": "eyJhbGci..." }
```

**Errores:** `401` credenciales incorrectas · `404` email no existe

---

### Users — requiere token

#### `GET /users/me`
Devuelve el perfil del usuario autenticado.

**Roles:** PASSENGER o DRIVER

**Respuesta 200:**
```json
{
  "id": 1,
  "firstName": "Ana",
  "lastName": "Garcia",
  "email": "ana@uber.com",
  "role": "PASSENGER",
  "available": true,
  "rating": 0.0
}
```

---

#### `GET /drivers/available`
Lista los conductores disponibles para aceptar viajes.

**Roles:** solo PASSENGER

**Respuesta 200:** array de `UserResponse` con `available: true`

```json
[
  {
    "id": 1,
    "firstName": "Carlos",
    "lastName": "Rios",
    "email": "carlos@uber.com",
    "role": "DRIVER",
    "available": true,
    "rating": 4.8
  }
]
```

---

### Trips — requiere token

#### `POST /trips`
El pasajero solicita un nuevo viaje. Se crea en estado `PENDING`.

**Roles:** solo PASSENGER

**Body:**
```json
{
  "pickupAddress": "string (requerido)",
  "dropoffAddress": "string (requerido)"
}
```

**Respuesta 201:**
```json
{
  "id": 4,
  "status": "PENDING",
  "pickupAddress": "Av. Javier Prado 100",
  "dropoffAddress": "Miraflores, Lima",
  "requestedAt": "2026-06-24T20:00:00Z",
  "acceptedAt": null,
  "completedAt": null,
  "passenger": { "id": 4, "firstName": "Ana", ... },
  "driver": null,
  "passengerRating": null,
  "ratingComment": null
}
```

---

#### `GET /trips`
Historial de viajes del pasajero autenticado.

**Roles:** solo PASSENGER

**Respuesta 200:** array de `TripResponse`

---

#### `GET /trips/pending`
Lista todos los viajes en estado `PENDING` disponibles para aceptar.

**Roles:** solo DRIVER

**Respuesta 200:** array de `TripResponse`

---

#### `GET /trips/my`
Historial de viajes del conductor autenticado (aceptados y completados).

**Roles:** solo DRIVER

**Respuesta 200:** array de `TripResponse`

---

#### `GET /trips/{id}`
Detalle de un viaje. Solo el pasajero o el conductor del viaje pueden verlo.

**Roles:** PASSENGER o DRIVER

**Respuesta 200:** `TripResponse`

**Errores:** `403` si no eres participante del viaje · `404` viaje no existe

---

#### `PATCH /trips/{id}/accept`
El conductor acepta un viaje PENDING. El viaje pasa a `IN_PROGRESS` y el conductor queda marcado como no disponible.

**Roles:** solo DRIVER

**Restricciones:**
- El viaje debe estar en estado `PENDING`
- El conductor debe estar disponible (`available: true`)

**Respuesta 200:** `TripResponse` con `status: "IN_PROGRESS"` y `driver` asignado

**Errores:**
- `400` `"Trip is not available for acceptance"` — viaje no está PENDING
- `400` `"Driver is not available"` — conductor ya tiene un viaje activo

---

#### `PATCH /trips/{id}/complete`
El conductor marca el viaje como completado. El viaje pasa a `COMPLETED` y el conductor queda disponible nuevamente.

**Roles:** solo DRIVER (debe ser el conductor asignado al viaje)

**Restricciones:**
- El viaje debe estar en estado `IN_PROGRESS`
- Solo el conductor asignado puede completarlo

**Respuesta 200:** `TripResponse` con `status: "COMPLETED"` y `completedAt` set

**Errores:**
- `400` `"Trip is not in progress"` — viaje no está IN_PROGRESS
- `403` si no eres el conductor asignado

---

#### `POST /trips/{id}/rate`
El pasajero califica el viaje con 1-5 estrellas. Actualiza el rating promedio del conductor.

**Roles:** solo PASSENGER (debe ser el pasajero del viaje)

**Restricciones:**
- El viaje debe estar en estado `COMPLETED`
- Solo se puede calificar una vez

**Body:**
```json
{
  "rating": 5,
  "comment": "string (opcional)"
}
```

**Respuesta 200:** `TripResponse` con `passengerRating` y `ratingComment` actualizados

**Errores:**
- `400` `"Trip must be completed before rating"` — viaje no está COMPLETED
- `400` `"Trip has already been rated"` — ya fue calificado
- `403` si no eres el pasajero del viaje

---

## Flujo completo del viaje

```
PASSENGER                          DRIVER
    |                                 |
    | POST /trips                     |
    | → status: PENDING               |
    |                                 |
    |              GET /trips/pending |
    |              ← lista de viajes  |
    |                                 |
    |         PATCH /trips/{id}/accept|
    |              → status: IN_PROGRESS
    |                                 |
    |       PATCH /trips/{id}/complete|
    |              → status: COMPLETED|
    |                                 |
    | POST /trips/{id}/rate           |
    | → rating guardado               |
    | → rating del conductor actualizado
```

## Estados del viaje

```
PENDING → IN_PROGRESS → COMPLETED
```

No hay transiciones hacia atrás. Cualquier operación fuera de orden devuelve `400`.

---

## Lo que debes implementar en el frontend

Tu frontend React + TypeScript debe cubrir al menos:

### Pantallas mínimas

1. **Login / Registro** — formulario con selector de rol (PASSENGER o DRIVER). Guardar el token en `localStorage` y enviarlo en cada request como `Authorization: Bearer <token>`.

2. **Vista PASSENGER:**
   - Formulario para pedir un viaje (origen y destino)
   - Lista de mis viajes con badge de estado (`PENDING` / `IN_PROGRESS` / `COMPLETED`)
   - Detalle de viaje: ver conductor asignado, botón "Calificar" si está COMPLETED y sin rating

3. **Vista DRIVER:**
   - Lista de viajes disponibles (PENDING) con botón "Aceptar"
   - Viaje activo (IN_PROGRESS) con botón "Completar viaje"
   - Historial de viajes completados

### Tips de implementación

- Detecta el rol del usuario desde `GET /users/me` y renderiza la vista correspondiente
- Para simular tracking en tiempo real, puedes usar `setInterval` llamando `GET /trips/{id}` cada 3-5 segundos mientras el viaje esté PENDING o IN_PROGRESS
- Los campos `driver`, `acceptedAt`, `completedAt`, `passengerRating` pueden ser `null` — manéjalos con optional chaining (`?.`) en TypeScript
- Los errores de la API tienen siempre la forma `{ "error": "mensaje" }` (excepto errores de validación que usan el nombre del campo como clave)
- Interceptor de Axios recomendado: agregar el token automáticamente y redirigir a login si la respuesta es `401`

### Tipos TypeScript sugeridos

```typescript
type Role = 'PASSENGER' | 'DRIVER';
type TripStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  available: boolean;
  rating: number;
}

interface Trip {
  id: number;
  status: TripStatus;
  pickupAddress: string;
  dropoffAddress: string;
  requestedAt: string;       // ISO 8601
  acceptedAt: string | null;
  completedAt: string | null;
  passenger: User;
  driver: User | null;
  passengerRating: number | null;
  ratingComment: string | null;
}
```

---

## Sistema de calificación — E2E Frontend (20 puntos)

Cada pantalla es obligatoria. Todos los endpoints del backend deben ser consumidos.

| # | Pantalla | Pts | Endpoints requeridos |
|---|---|---|---|
| 1 | **Login / Registro** — formulario con email, contraseña y selector de rol. Guarda el JWT en `localStorage`, lo adjunta en cada request como `Authorization: Bearer <token>` y redirige según rol | 3 | `POST /auth/register` · `POST /auth/login` · `GET /users/me` |
| 2 | **Dashboard pasajero** — muestra nombre del usuario, botón para pedir viaje y lista de sus viajes con badge de estado (`PENDING` / `IN_PROGRESS` / `COMPLETED`) | 3 | `GET /users/me` · `GET /trips` |
| 3 | **Solicitar viaje** — muestra conductores disponibles antes de confirmar, formulario con origen y destino, llama `POST /trips` y redirige al detalle del viaje creado | 2 | `GET /drivers/available` · `POST /trips` |
| 4 | **Detalle de viaje (pasajero)** — muestra pickup, dropoff, estado y conductor asignado (nombre + rating) o "buscando conductor..." si `driver` es `null`. Si el viaje está `COMPLETED` y `passengerRating` es `null`, muestra formulario de calificación (1–5 estrellas + comentario opcional). Hace polling cada 3–5 s mientras el estado sea `PENDING` o `IN_PROGRESS` | 4 | `GET /trips/{id}` · `POST /trips/{id}/rate` |
| 5 | **Dashboard conductor** — muestra su propio rating, lista viajes `PENDING` con botón "Aceptar" y resalta al inicio el viaje activo (`IN_PROGRESS`) con botón "Completar viaje" | 4 | `GET /users/me` · `GET /trips/pending` · `GET /trips/my` · `PATCH /trips/{id}/accept` |
| 6 | **Detalle de viaje (conductor)** — muestra pickup, dropoff y datos del pasajero. Botón "Completar viaje" si el estado es `IN_PROGRESS`. Muestra resumen tras completar | 2 | `GET /trips/{id}` · `PATCH /trips/{id}/complete` |
| 7 | **Historial** — tabla de viajes pasados para ambos roles con filtro por estado | 2 | `GET /trips` (PASSENGER) · `GET /trips/my` (DRIVER) |
