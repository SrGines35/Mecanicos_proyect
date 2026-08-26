# Avance del Front — Oaxicanicos

Estado del front al 26 de agosto de 2026, ya alineado con la rama `Dropxni` del back. La idea es que cualquiera del equipo pueda
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

## El interruptor: qué se conecta al back y qué no

En `src/environments/environment.ts`:

```ts
export const environment = {
  apiUrl: 'http://localhost:3000/api',
  api: {
    auth: false,
    authMe: false,
    mecanicos: false,
    solicitudes: false,
  },
};
```

Antes había una sola bandera para toda la app. Se separó en cuatro porque el back
no está parejo: autenticación ya funciona, pero mecánicos y solicitudes todavía no
existen del lado de ellos. Con banderas separadas se puede conectar solo lo que sí
está listo.

| Bandera | Qué cubre | Se puede poner en `true` |
|---|---|---|
| `auth` | registro y login | Sí, en cuanto la rama `Dropxni` esté en `main` y el back esté corriendo |
| `authMe` | editar teléfono y eliminar cuenta | Sí, ya existen `PATCH /auth/me` y `DELETE /auth/me` |
| `mecanicos` | perfil del mecánico, estado, mecánicos cercanos | Sí, ya está hecho en la rama `Dropxni` |
| `solicitudes` | todo el flujo del servicio | No, el back todavía no tiene ese módulo |

En `false` la app funciona sola con `localStorage`, completa de punta a punta.

**La URL lleva `/api`** porque el back ya tiene `setGlobalPrefix('api')`. Las rutas
quedan como `http://localhost:3000/api/auth/login`.

## Pantallas

| Ruta | Quién | Pantalla |
|---|---|---|
| `/` | todos | Iniciar sesión |
| `/registro` | todos | Crear cuenta, como cliente o como mecánico |
| `/usuario/home` | cliente | Su servicio en curso, cancelar, calificar o pedir uno nuevo |
| `/usuario/perfil` | cliente | Sus datos. Solo el teléfono se puede editar |
| `/usuario/solicitar-servicio` | cliente | Ubicación en el mapa, falla y mecánicos cercanos |
| `/mecanico` | mecánico | Panel: estado y solicitudes nuevas |
| `/mecanico/perfil` | mecánico | Descripción, zona y ubicación |
| `/mecanico/solicitud/:id` | mecánico | Detalle, mapa, costos y avance del servicio |
| cualquier otra | todos | Página no encontrada |

## Cómo funciona la sesión

Al iniciar sesión, el back devuelve dos tokens. El front los guarda en el
navegador (`localStorage`), así que **la sesión sobrevive aunque se cierre la
pestaña o el navegador**: al volver a abrir la app entra directo, sin pasar por
el login.

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
   - `perfilCompletoGuard` — si el mecánico no ha llenado su perfil, no entra al panel.

## Cómo está organizado el código

```
src/environments/          -> las banderas y la URL del back
src/app/
  core/
    models/        -> las interfaces (auth, mecánico, solicitud)
    services/      -> auth, sesión, mecánico, solicitudes
    guards/        -> sesión, rol y perfil completo
    interceptores/ -> el que renueva el token
    validadores/   -> las reglas de validación
    utils/         -> cálculo de distancia (Haversine)
  shared/          -> logo, ojito, barra superior, barra de progreso, mapa, directivas
  features/
    login/
    registro/
    no-encontrada/
    usuario/       -> layout, home, perfil, solicitar-servicio   (Luz)
    mecanico/      -> panel, perfil, detalle-solicitud, menú     (Freidy)
```

**El reparto:** Luz trabaja en `features/usuario/`, Freidy en
`features/mecanico/`. Lo de `core/` y `shared/` se acuerda entre los dos antes de
tocarlo, porque ahí sí se pueden pisar.

## Lo acordado con el equipo de back

Los nombres son los que ya tenía Guillermo en el repo `App_Mecanicos`.

```
POST   /api/auth/register    { nombre, correo, telefono, password, role }
POST   /api/auth/login       { correo, password }
POST   /api/auth/refresh     { refreshToken }
GET    /api/auth/me          header Authorization: Bearer <token>
PATCH  /api/auth/me          { telefono }
DELETE /api/auth/me
```

Respuesta de register y login:

```json
{ "user": { "id", "nombre", "correo", "telefono", "role" },
  "tokens": { "accessToken", "refreshToken" } }
```

El rol se llama **`cliente`** o **`mecanico`** (no "usuario").

### Los nombres ya coinciden

El back se adaptó a los nombres del front. Su respuesta de mecánico es exactamente
nuestro `PerfilMecanico`:

```json
{ "usuarioId", "nombre", "telefono", "descripcion",
  "latitud", "longitud", "zonaTrabajo",
  "estado", "calificacion" }
```

Con `estado` en `disponible | ocupado | no_disponible`, igual que el front. Y
`GET /api/mechanics/nearby` agrega `distanciaKm` ya calculado.

Por eso **el front ya no traduce nada**. Los mapas de estado y los mapeadores
`desdeBack` / `haciaBack` se quitaron: si se dejan, buscan campos que ya no existen y
todo llega vacío.

Tres detalles que sí maneja el front:

- `GET /api/mechanics/profile/me` responde **404** cuando el mecánico todavía no tiene
  perfil. El front atrapa ese 404 y lo convierte en `null`, que es lo que espera el
  resto de la app.
- `nearby` busca en 5 km por defecto. El front manda `radio=50000`, que es el máximo
  que permite el back.
- La calificación llega en `0` cuando nadie ha calificado. Como las estrellas van de 1
  a 5, el front trata el `0` como `null` y muestra "sin calificaciones todavía".

### Lo que todavía falta del back

Está detallado en `PARA-EL-BACK.md`. En corto:

```
ValidationPipe global en main.ts
Mergear la rama Dropxni a main
Todo el módulo de solicitudes, con el campo rechazadaPor
```

Mientras el módulo de solicitudes no exista, ese pedazo corre con datos simulados.

### Estados de la solicitud

```
pendiente, aceptada, en_camino, en_proceso, completada, cancelada, rechazada
```

Escritos exactamente así, minúsculas y guion bajo. La barra de progreso muestra los
cuatro del medio; en `pendiente` no se enciende ninguno.

El cliente puede cancelar **solo mientras está en `pendiente`**. En cuanto un
mecánico acepta, el botón desaparece.

### Cómo se reparte una solicitud entre los mecánicos

La solicitud le aparece a **todos los mecánicos disponibles cercanos, ordenada por
distancia**, y se la lleva el primero que la acepte.

Cada solicitud lleva `rechazadaPor`, un arreglo con los ids de los mecánicos que le
dieron rechazar. Rechazar **no mata la solicitud**: solo la esconde para ese mecánico.

Cuando ya ningún mecánico disponible puede verla, al cliente le sale el aviso "no hay
mecánicos cerca" con dos botones:

- **Seguir esperando** vacía `rechazadaPor`, así que la solicitud vuelve a aparecerles
  a todos, incluidos los que la habían rechazado. Sirve para cuando un mecánico se
  pone disponible más tarde.
- **Cancelar solicitud**, que hace lo mismo que el botón normal.

### Estados del mecánico

```
disponible, ocupado, no_disponible
```

Un mecánico solo aparece en las búsquedas si está `disponible` **y** tiene el
perfil completo (descripción, zona y ubicación). Sin coordenadas no se puede
calcular la distancia.

Al terminar de llenar el perfil **por primera vez**, el mecánico queda
`disponible` solo, sin tener que ir a prenderlo a mano. Después se respeta lo
que él elija, con dos excepciones automáticas:

- Al **aceptar** una solicitud pasa a `ocupado`, para que no le lleguen más.
- Al **terminar** el servicio regresa a `disponible`.

Aun así puede cambiarlo a mano cuando quiera desde el panel.

**Sin el perfil completo no entra al panel.** El guard `perfilCompletoGuard` protege
`/mecanico` y `/mecanico/solicitud/:id` y lo manda a `/mecanico/perfil`. No tiene
sentido mostrarle solicitudes ordenadas por cercanía si todavía no tiene ubicación.

### Lo que se quitó

**Recuperar contraseña.** La pantalla existía y funcionaba, pero el equipo
decidió no incluirla en esta entrega. Si algún día se retoma, está en el
historial de git.

**Los datos de ejemplo.** Se borraron los mecánicos falsos y el archivo de
solicitudes de prueba. La app arranca vacía.

## Lo que está simulado

Todo lo que está detrás de las banderas:

- `auth.service.ts` — cuentas guardadas en el navegador
- `mecanico.service.ts` — perfil guardado en el navegador, uno por usuario
- `solicitud.service.ts` — las solicitudes se guardan en el navegador

Las tres devuelven `Observable`, igual que las llamadas reales, así que cambiar
de uno a otro no obliga a tocar ninguna pantalla.

Llaves de `localStorage`:

```
oaxicanicos.accessToken        oaxicanicos.usuario
oaxicanicos.refreshToken       oaxicanicos.cuentasSimuladas
oaxicanicos.perfilesSimulados  oaxicanicos.solicitudesSimuladas
```

Para borrar todo y empezar de cero: F12 → Console → `localStorage.clear()` → F5.

## Cómo probar la app completa sin el back

1. Regístrate como **cliente** y crea una solicitud.
2. Dale **Salir**.
3. Regístrate como **mecánico**, llena tu perfil y ponte **disponible**.
4. La solicitud del cliente aparece en tu panel con la distancia real. Acéptala y
   ve avanzando los pasos: en camino, empezar reparación, capturar costos, terminar.
5. Sal y vuelve a entrar como cliente: ves quién te atendió, su teléfono, el total
   y la pantalla para calificarlo.
6. Vuelve a entrar como mecánico: tu calificación ya aparece en el panel.

## Lo que falta

- [ ] Notificaciones
- [ ] Conectar con los endpoints reales cuando existan
- [ ] Que editar el teléfono y eliminar la cuenta se guarden en la base de datos
      (faltan `PATCH /auth/me` y `DELETE /auth/me`)
- [ ] Más pruebas automáticas (hoy solo está `app.spec.ts`)

## Notas técnicas

- La navegación del mecánico es un **menú fijo abajo**
  (`features/mecanico/menu-mecanico`) con Inicio y Perfil, como las
  apps del celular. El botón de Salir se queda en la barra de arriba.
- **Zoneless**: todo valor asíncrono tiene que guardarse en un signal con `.set()`,
  o la vista nunca se repinta.
- **`computed()` no reacciona al `.value` de un formulario reactivo.** Hay que usar
  `toSignal(control.valueChanges, { initialValue: ... })`. Los tres contadores de
  caracteres de la app ya están hechos así.
- El modal de cerrar sesión lleva `z-index: 2000` porque Leaflet mete sus capas hasta
  1000 y el mapa tapaba el cuadro de confirmación.
