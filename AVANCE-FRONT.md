# Avance del Front — MecaGo

Este archivo explica que se hizo en la rama `front-freidy`, como correrlo y que falta.
La idea es que Luz y el equipo de back puedan continuar sin tener que preguntar nada.

## Que es la app

Una aplicacion web estilo DiDi pero de mecanicos: el usuario dice que se le
descompuso, la app busca mecanicos cerca de el, los ordena del mas cercano al
mas lejano y le asigna uno.

## Como correrlo

```bash
npm install
ng serve
```

Y se abre en `http://localhost:4200/`.

## Pantallas que ya estan

| Ruta | Que hace |
|---|---|
| `/` | Inicio. El usuario elige que servicio necesita (general, electrico, llantas, frenos, motor, grua). |
| `/solicitar` | Formulario: vehiculo, descripcion del problema y direccion. Tiene boton para llenar la direccion con el GPS. |
| `/mecanicos` | Lista de mecanicos ordenados por cercania. Se puede filtrar por especialidad y por disponibilidad, y ampliar el radio de busqueda. |
| `/mecanicos/:id` | Perfil completo del mecanico y boton para confirmar el servicio. |
| `/seguimiento/:id` | Los 4 pasos del servicio: aceptada, en camino, atendiendo, terminado. |

## Como esta organizado el codigo

```
src/app/
  core/
    models/      -> las interfaces (Mecanico, Solicitud, Ubicacion)
    data/        -> datos simulados y catalogo de servicios
    utils/       -> calculo de distancia
    services/    -> geolocalizacion, mecanicos y solicitudes
  shared/        -> componentes que se repiten (encabezado, tarjeta, pipe)
  features/      -> una carpeta por pantalla
```

La regla es sencilla: **`core` no sabe nada de las pantallas, y las pantallas no
tienen logica de negocio adentro**. Todo lo que sea "buscar", "calcular" o
"guardar" vive en un servicio.

## Lo que esta simulado (y hay que cambiar cuando el back este listo)

Estos tres puntos son los unicos que tocan datos falsos:

1. `core/data/mecanicos.mock.ts` — diez mecanicos inventados con coordenadas
   reales de Oaxaca. Se borra cuando exista el endpoint.
2. `core/services/mecanico.service.ts` — hoy devuelve el mock con un retardo
   artificial. Solo hay que cambiar el cuerpo de los metodos por llamadas con
   `HttpClient`; **las firmas ya devuelven `Observable`, asi que las pantallas
   no se tocan**.
3. `features/seguimiento/seguimiento.ts` — el metodo `simularAvance()` mueve los
   pasos con un temporizador cada 4 segundos. Ahi va el WebSocket o el polling real.

## Endpoints que necesitamos del back

Para que esto conecte sin cambiar nada de la estructura:

- `GET /mecanicos` — todos los mecanicos.
- `GET /mecanicos/:id` — uno solo.
- `GET /mecanicos/cercanos?lat=&lng=&especialidad=&radioKm=` — los cercanos ya
  ordenados (o nos los mandan todos y el front calcula, como esta ahorita).
- `POST /solicitudes` — crea la solicitud y regresa el id.
- `GET /solicitudes/:id` — el estado actual del servicio.

La forma de los objetos esta en `src/app/core/models/`. Si el back respeta esos
nombres de campo, el front no necesita ningun ajuste.

## Que falta (para repartirnos)

- [ ] Mapa real con Leaflet u OpenStreetMap en `/mecanicos` (hoy solo es lista).
- [ ] Pantalla de calificar al mecanico al terminar el servicio.
- [ ] Login y registro.
- [ ] Historial de servicios del usuario.
- [ ] Conectar con la API real (los 3 puntos de arriba).
- [ ] Que la solicitud no se pierda al recargar la pagina (hoy vive en memoria).

## Notas tecnicas

- El proyecto es **Angular 21** con componentes standalone y sin zone.js
  (zoneless). Por eso el estado se maneja con **signals** y no con `BehaviorSubject`.
- Las plantillas usan el control de flujo nuevo (`@if`, `@for`), no `*ngIf` ni `*ngFor`.
- El diseño esta pensado para celular (contenedor de 480px). Los colores estan en
  variables CSS al inicio de `src/styles.css`, asi que cambiar la paleta es
  modificar un solo bloque.
