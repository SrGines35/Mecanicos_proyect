# Avance del Front — Oaxicanicos

Estado del front al día de hoy. La idea es que cualquiera del equipo pueda
seguirle sin tener que preguntar nada.

## Qué es la app

Una aplicación web estilo DiDi pero de mecánicos: el cliente dice qué se le
descompuso, la app le muestra los mecánicos disponibles más cercanos y le manda
una solicitud. El mecánico la recibe, la acepta y va.

## Cómo correrlo

```bash
npm install
npm start
```

Se abre en `http://localhost:4200/`.

## El interruptor: datos simulados o back real

En `src/environments/environment.ts`:

```ts
export const environment = {
  usarApiReal: false,          // <- este
  apiUrl: 'http://localhost:3000',
};
```

- **En `false`** (como está ahora): la app funciona sola, con datos inventados
  en memoria. Sirve para desarrollar y probar sin depender del back.
- **En `true`**: llama al back de verdad.

**Cuando el back esté listo se cambia esa línea y ya.** No hay que tocar nada
más: los servicios ya apuntan a los endpoints correctos.

## Pantallas

| Ruta | Quién | Pantalla |
|---|---|---|
| `/` | todos | Iniciar sesión |
| `/registro` | todos | Crear cuenta, como cliente o como mecánico |
| `/cliente` | cliente | Inicio del cliente *(le toca a Luz)* |
| `/mecanico` | mecánico | Panel: estado y solicitudes nuevas |
| `/mecanico/perfil` | mecánico | Descripción, zona y ubicación |
| `/mecanico/solicitud/:id` | mecánico | Detalle, costos y avance del servicio |

## Cómo funciona la sesión

Al iniciar sesión, el back devuelve dos tokens. El front los guarda en el
navegador (`localStorage`), así que **la sesión sobrevive aunque se cierre la
pestaña o el navegador**: al volver a abrir la app entra directo, sin pasar por
el login. Como Instagram.

Tres piezas hacen eso:

1. **`SesionService`** guarda y lee los tokens y el usuario.
2. **`authInterceptor`** le pega el token a cada llamada. Si el back contesta
   401 porque el token venció, pide uno nuevo con el refresh token y **repite la
   llamada original** sin que el usuario se entere.
3. **Los guards** deciden a dónde entra cada quien:
   - `sesionGuard` — si no hay sesión, al login.
   - `rolGuard('mecanico')` — si un cliente intenta entrar al panel del
     mecánico, lo regresa al suyo.
   - `invitadoGuard` — si ya hay sesión, el login ni se muestra.

## Cómo está organizado el código

```
src/environments/          -> el interruptor y la URL del back
src/app/
  core/
    models/        -> las interfaces (auth, mecánico, solicitud)
    data/          -> datos simulados
    services/      -> auth, sesión, mecánico, solicitudes
    guards/        -> sesión y rol
    interceptores/ -> el que renueva el token
    validadores/   -> las reglas de validación
    utils/         -> cálculo de distancia (Haversine)
  shared/          -> logo, ojito de contraseña, barra superior, directivas
  features/
    login/
    registro/
    cliente/       -> LE TOCA A LUZ
    mecanico/      -> panel, perfil, detalle-solicitud
```

**El reparto:** Luz trabaja en `features/cliente/`, Freidy en
`features/mecanico/`. Lo de `core/` se acuerda entre los dos antes de tocarlo,
porque ahí sí se pueden pisar.

## Lo acordado con el equipo de back

Los nombres son los que ya tenía Guillermo en el repo `App_Mecanicos`. El front
se adaptó a ellos, no al revés.

```
POST /auth/register    { nombre, correo, telefono, password, role }
POST /auth/login       { correo, password }
POST /auth/refresh     { refreshToken }
GET  /auth/me          header Authorization: Bearer <token>
```

Respuesta de register y login:

```json
{ "user": { "id", "nombre", "correo", "role" },
  "tokens": { "accessToken", "refreshToken" } }
```

El rol se llama **`cliente`** o **`mecanico`** (no "usuario").

### Endpoints que todavía faltan del back

```
GET   /mecanicos/mi-perfil
PUT   /mecanicos/mi-perfil
PATCH /mecanicos/estado
GET   /solicitudes
GET   /solicitudes/:id
PATCH /solicitudes/:id/estado
PATCH /solicitudes/:id/costos
```

Mientras no existan, esas pantallas corren con datos simulados.

### Estados de la solicitud

```
pendiente, aceptada, en_camino, en_proceso, completada, cancelada, rechazada
```

Escritos exactamente así, minúsculas y guion bajo.

### Estados del mecánico

```
disponible, ocupado, no_disponible
```

Un mecánico solo aparece en las búsquedas si está `disponible` **y** tiene el
perfil completo (descripción, zona y ubicación). Sin coordenadas no se puede
calcular la distancia.

### Dos cosas que el back tiene pendientes

1. **`GET /auth/me` no devuelve el `nombre`**, solo id, correo y role. Por eso
   el front también guarda el usuario en el navegador. Si lo agregan, mejor.
2. **El `accessToken` dura 15 minutos.** El interceptor lo renueva solo, así que
   funciona, pero para la presentación conviene subirlo a varios días.

## Lo que está simulado

Todo lo que está detrás del interruptor `usarApiReal`:

- `core/services/auth.service.ts` — cuentas en memoria
- `core/services/mecanico.service.ts` — perfil en memoria
- `core/services/solicitud.service.ts` — usa `core/data/solicitudes.mock.ts`

Las tres devuelven `Observable`, igual que las llamadas reales, así que cambiar
de uno a otro no obliga a tocar ninguna pantalla.

## Lo que falta

- [ ] Pantallas del cliente: mapa, lista de mecánicos, crear solicitud (Luz)
- [ ] Mapa con Leaflet. Por ahora el mecánico marca su ubicación con el GPS del
      navegador, sin mapa. Falta poder ajustar el pin a mano
- [ ] Conectar con los endpoints reales cuando existan
- [ ] Que el cliente pueda calificar al mecánico al terminar
- [ ] Recuperar contraseña

## Notas técnicas

- Angular 21, componentes standalone, sin zone.js. El estado se maneja con
  **signals**.
- Formularios **reactivos**, no `ngModel`.
- Plantillas con el control de flujo nuevo (`@if`, `@for`).
- La paleta está en variables CSS al inicio de `src/styles.css`. El **rojo se
  usa solo para errores**; el color de la marca es el ámbar.
- El mapa va a ser **Leaflet + OpenStreetMap**, no Google Maps: Google pide
  tarjeta de crédito para la llave de la API.
- La distancia la calcula el front con Haversine
  (`core/utils/distancia.util.ts`), así el back no tiene que hacer consultas
  geográficas.
