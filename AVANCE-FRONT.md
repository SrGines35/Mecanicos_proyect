# Avance del Front — Oaxicanicos

Estado del front al día de hoy. La idea es que cualquiera del equipo pueda
seguirle sin tener que preguntar nada.

## Qué es la app

Una aplicación web estilo DiDi pero de mecánicos: el usuario dice qué se le
descompuso y la app le manda al mecánico disponible más cercano.

## Cómo correrlo

```bash
npm install
npm start
```

Se abre en `http://localhost:4200/`.

## Pantallas que hay ahorita

| Ruta | Pantalla |
|---|---|
| `/` | Iniciar sesión |
| `/registro` | Crear cuenta, como usuario o como mecánico |

> El flujo de pedir mecánico (inicio, solicitud, lista de cercanos, detalle y
> seguimiento) se hizo en una etapa anterior y se sacó del proyecto para
> enfocarse primero en la autenticación. **No se perdió**: sigue en el historial
> de git, en los commits de la rama `front-freidy`. Se puede recuperar cuando
> se necesite.

## Cómo está organizado el código

```
src/app/
  core/
    models/       -> las interfaces (Rol, Credenciales, RegistroUsuario, ...)
    data/         -> catálogo de especialidades
    services/     -> AuthService (hoy simulado)
    validadores/  -> todas las reglas de validación en un solo archivo
  shared/
    logo/         -> la llave inglesa en SVG
    icono-ojo/    -> botón de mostrar/ocultar contraseña
    directivas/   -> SoloNumeros, para campos que solo aceptan dígitos
  features/
    login/
    registro/
```

La regla: `core` no sabe nada de las pantallas, y las pantallas no traen reglas
de negocio adentro. Todo lo de validar, guardar o consultar vive en `core`.

## Reglas de validación (están en `core/validadores/validadores.ts`)

| Campo | Regla |
|---|---|
| Nombre | Solo letras, acentos, espacios y guiones. De 3 a 60 caracteres. |
| Correo | Cualquier dominio, no solo Gmail. |
| Teléfono | Exactamente 10 dígitos. No deja escribir letras. |
| Contraseña | Mínimo 8 caracteres, con al menos una letra y un número. |
| Confirmar | Debe ser igual a la contraseña. |
| Especialidades | Al menos una (solo mecánicos). |
| Experiencia | Número de 0 a 60 (solo mecánicos). |
| Tarifa base | Mayor a 0 (solo mecánicos). |
| Zona | Mínimo 4 caracteres (solo mecánicos). |

Los mensajes de error solo aparecen cuando el usuario ya tocó el campo, o
cuando le da al botón de enviar. Así no lo recibe todo en rojo desde el inicio.

## Lo que está simulado

Un solo punto: `core/services/auth.service.ts`. Hoy guarda las cuentas en
memoria (se pierden al recargar la página) y responde con un retardo falso
para que se vea el "cargando".

Cuando exista el back, se cambia el cuerpo de esos métodos por llamadas con
`HttpClient`. **Las firmas ya devuelven `Observable`, así que las pantallas no
se tocan.**

## Endpoints que necesitamos del back

```
POST /auth/login              -> { correo, contrasena }
POST /auth/registro/usuario   -> { nombre, correo, telefono, contrasena, rol }
POST /auth/registro/mecanico  -> lo anterior + { especialidades, experiencia, tarifaBase, zonaTrabajo }
GET  /auth/perfil
```

Los tres deben devolver: `{ token, id, nombre, correo, rol }`.

El `rol` es la pieza clave: con eso la app decide a qué pantallas mandar a cada
quien y protege las rutas.

La forma exacta de los objetos está en `src/app/core/models/auth.model.ts`. Si
el back respeta esos nombres de campo, el front no necesita ningún ajuste.

## Lo que falta

- [ ] Guard que proteja las rutas según el rol.
- [ ] Guardar la sesión para que no se pierda al recargar (hoy vive en memoria).
- [ ] Recuperar contraseña.
- [ ] Pantallas internas del usuario y del mecánico (recuperar el flujo anterior).
- [ ] Conectar con la API real.

## Notas técnicas

- Angular 21, componentes standalone, sin zone.js (zoneless). El estado se
  maneja con **signals**.
- Los formularios son **Reactive Forms**, no `ngModel`. Se cambió a propósito:
  con `ngModel` de una sola vía, limpiar un valor en el componente no borraba
  lo que ya se veía escrito en la pantalla (por eso antes se quedaban las
  letras en el campo de teléfono).
- Las plantillas usan el control de flujo nuevo (`@if`, `@for`).
- La paleta está en variables CSS al inicio de `src/styles.css`. El **rojo se
  reserva solo para errores**; el color de la marca es el ámbar. Si la marca
  fuera roja, un campo mal llenado se confundiría con el diseño normal.
