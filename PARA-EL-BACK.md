# Para José Manuel — lo que el front necesita del back

Actualizado el 26 de agosto de 2026, después de revisar la rama `Dropxni`.

Primero: **gracias por adaptarte a nuestros nombres.** Revisamos tu rama y la respuesta
de mecánicos cuadra exactamente con lo que el front esperaba. Ya quitamos todos los
traductores que teníamos de nuestro lado. **De aquí en adelante el front no vuelve a
cambiar nombres**, para que no tengas que ir corriendo atrás de nosotros.

---

## 1. Lo que ya revisamos y está bien

De la rama `Dropxni`:

- CORS para `http://localhost:4200`
- `setGlobalPrefix('api')` — ya volvimos a poner el `/api` en nuestra URL
- La migración inicial, con las dos tablas
- `GET /api/mechanics/profile/me`, `POST /api/mechanics/profile`,
  `PATCH /api/mechanics/profile/me`, `GET /api/mechanics/nearby`
- `PATCH /api/auth/me` y `DELETE /api/auth/me`
- El enum `disponible | ocupado | no_disponible`, igual que el nuestro

El front ya está apuntado a todo eso. Solo hay que prender las banderas cuando el back
esté corriendo.

Tres cosas que resolvimos de nuestro lado para no darte trabajo, solo para que las
sepas:

- `profile/me` responde **404** cuando el mecánico no tiene perfil. El front lo atrapa
  y lo convierte en `null`. No lo cambies.
- `nearby` busca en 5 km por defecto, así que el front manda `radio=50000`.
- `calificacion` llega en `0` cuando nadie ha calificado. Como las estrellas van de 1 a
  5, el front trata el `0` como "sin calificaciones". Tampoco lo cambies.

---

## 2. Lo urgente, y es una línea

En `src/main.ts` falta el **`ValidationPipe` global**:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

Sin eso los DTO no se ejecutan, y el problema serio está en `nearby`: el
`@Type(() => Number)` de `NearbyQueryDto` nunca convierte `lat` y `lng`, así que a la
consulta de PostGIS le llegan como texto y truena. Con `transform: true` queda.

Y cuando puedas, **mergea `Dropxni` a `main`**, porque hoy `main` todavía no tiene nada
de esto y no podemos probar contra ella.

---

## 3. El módulo de solicitudes: ya lo vimos, y quedó bien

Revisamos tu commit `feat(requests): adaptar respuesta de solicitudes al frontend`.
Las siete rutas coinciden exactamente con lo que el front ya tenía escrito:

```
POST  /api/solicitudes
GET   /api/solicitudes
GET   /api/solicitudes/mias
GET   /api/solicitudes/:id
PATCH /api/solicitudes/:id/estado
PATCH /api/solicitudes/:id/costos
PATCH /api/solicitudes/:id/calificacion
```

Los cuerpos también cuadran: `vehiculo`, `descripcionFalla`, `latitudOrigen`,
`longitudOrigen` al crear; `costoPiezas` y `costoManoObra` en costos; `calificacion`
del 1 al 5. Los estados están escritos igual que en el front. Y nos gustó que ya
controles que **solo el primer mecánico que acepta se la queda**, que un cliente no
pueda tener dos solicitudes vivas, y que la `tarifaApp` se calcule del lado del back.
Eso el front no lo podía garantizar.

Nos faltan tres cosas de tu lado. Las dos primeras son chicas.

### 3.1 Falta `mecanico` en la respuesta

En `transformarSolicitud()` armas `cliente` con nombre y teléfono, pero no armas
`mecanico`. La relación ya la traes cargada, así que es agregarle:

```ts
mecanico: solicitud.mecanico
  ? {
      nombre: solicitud.mecanico.nombre,
      telefono: solicitud.mecanico.telefono ?? '',
    }
  : null,
```

Y en `RequestResponse`:

```ts
mecanico: { nombre: string; telefono: string } | null;
```

El cliente lo necesita para ver **quién lo va a atender y a qué número marcarle**
cuando ya alguien aceptó. Hoy la pantalla lo muestra, pero solo con datos simulados;
en cuanto conectemos se queda vacía sin ese campo.

### 3.2 Falta `rechazadaPor`, y hay que retirar el estado `rechazada`

Esta es la importante, y es la que cambia lo que ya tienes escrito. Por eso te
escribimos ahorita y no después.

**Cómo lo tienes hoy:** `rechazada` es un estado global. Un mecánico rechaza y en
`cambiarEstado()` la solicitud queda muerta para todos, igual que `cancelada` o
`completada`.

**Cómo lo necesita el equipo:** rechazar es "yo no la tomo", no "esta solicitud se
acabó". Si el mecánico 1 rechaza, la solicitud le tiene que seguir apareciendo al
mecánico 2, al 3, y así.

Lo que hay que agregar en la tabla de solicitudes:

```
rechazada_por  ->  uuid[] o jsonb, por defecto vacío
```

Y dos rutas:

```
PATCH /api/solicitudes/:id/rechazo            (rol mecánico)
PATCH /api/solicitudes/:id/seguir-esperando   (rol cliente, solo el dueño)
```

- `rechazo` agrega el id del mecánico del token a `rechazadaPor`. **La solicitud se
  queda en `pendiente`.** Sin cuerpo, el mecánico sale del token.
- `seguir-esperando` deja `rechazadaPor` vacío, para que vuelva a aparecerles a todos.
  Solo el cliente dueño.

Las dos devuelven la solicitud completa, con `rechazadaPor` incluido en la respuesta.

Con eso el flujo del front queda así, y ya está hecho y probado:

- La solicitud le aparece a todos los mecánicos disponibles cercanos, ordenada por
  distancia. Se la lleva el primero que acepte.
- El que rechaza deja de verla. Los demás la siguen viendo.
- Cuando ya ningún mecánico disponible puede verla, al cliente le sale un aviso con dos
  botones: **seguir esperando** y **cancelar solicitud**.

El estado `RECHAZADA` del enum se puede quedar ahí sin usarse, o lo quitas. El front ya
no lo manda nunca.

### 3.3 Detalle de privacidad en `GET /api/solicitudes`

Ahorita devuelve **todas** las solicitudes de la base, sin filtro. Cualquier mecánico
ve los datos y el teléfono de todos los clientes, incluidas las de otros mecánicos.

El front filtra en pantalla, así que funciona, pero conviene filtrarlo en la consulta:

```
estado = 'pendiente'  OR  mecanico_id = <el del token>
```

No corre prisa como las dos de arriba, pero si el docente revisa, esto se nota.

### La forma completa que el front espera

```json
{
  "id": "uuid",
  "usuarioId": "uuid-del-cliente",
  "mecanicoId": "uuid-del-mecanico-o-null",
  "cliente": { "nombre": "Ana López", "telefono": "9511112233" },
  "mecanico": { "nombre": "Juan Pérez", "telefono": "9514445566" },
  "vehiculo": "Nissan Versa 2018 blanco",
  "descripcionFalla": "No arranca",
  "latitudOrigen": 17.0654,
  "longitudOrigen": -96.7237,
  "estado": "aceptada",
  "costoPiezas": 450,
  "costoManoObra": 300,
  "tarifaApp": 75,
  "fechaCreacion": "2026-08-26T18:30:00.000Z",
  "calificacion": null,
  "rechazadaPor": []
}
```

Lo único nuevo respecto a lo que ya devuelves son `mecanico` y `rechazadaPor`.

## 4. Cosa aparte, del lado del mecánico

El front ya pone al mecánico en `ocupado` cuando acepta y lo regresa a `disponible`
cuando termina, usando tu `PATCH /api/mechanics/profile/me`. No tienes que hacer nada,
solo que sepas que van a llegar esos dos PATCH extra por servicio.

---

## 5. Resumen

| Qué | Tamaño |
|---|---|
| `ValidationPipe` global en `main.ts` | 1 línea, urgente |
| Agregar `mecanico` a la respuesta de solicitudes | 5 líneas |
| Campo `rechazadaPor` y las rutas `/rechazo` y `/seguir-esperando` | mediano |
| Filtrar `GET /api/solicitudes` por pendiente o mío | chico, puede esperar |
| Mergear `Dropxni` a `main` | chico |

Si algo de esto no te cuadra o prefieres otros nombres para las rutas, dinos y lo
cambiamos del lado del front, que ahí es barato. Lo que sí te pedimos en serio es el
`rechazadaPor`, porque el flujo de rechazo ya está armado y probado en el front y sin
ese campo se pierde en cuanto conectemos.
