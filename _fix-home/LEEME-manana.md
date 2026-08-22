# Para Luz — pendientes de mañana

Yo no puedo correr comandos en tu computadora (solo leer y escribir archivos),
así que los pasos 1, 2, 4 y 5 los tienes que teclear tú. Son unos minutos.

El paso 3 ya está resuelto: dejé los dos archivos corregidos en la carpeta
`_fix-home/` dentro del proyecto.

---

## PASO 1 — Aplicar el paquete

Renombra `PARA-LUZ-cliente-pantallas.tar.gz` a `cliente-pantallas.tar.gz`
y ponlo, junto con el `.sh`, en la carpeta que CONTIENE App_mecanicos.

```bash
bash aplicar-cliente.sh
```

Deben salir 4 commits. Si alguno dice "(sin cambios)", párate y avísame.

Al final el script imprime "Archivos sueltos (debería estar vacío)" y ahí
**va a aparecer `?? _fix-home/`**. Es mío y es normal — se borra en el paso 3.

## PASO 2 — Compilar

```bash
cd App_mecanicos
npm install
npm run build
```

## PASO 3 — Mis tres correcciones (ya escritas)

```bash
cp _fix-home/home.ts   src/app/features/usuario/home/home.ts
cp _fix-home/home.html src/app/features/usuario/home/home.html
rm -rf _fix-home

npm run build
```

Si compila:

```bash
git add src/app/features/usuario/home
git commit -m "fix(usuario): avisar cuando falla la consulta y cerrar el tipo de los mensajes

Tres arreglos sobre el home:

Se quita verDetalle(), que no lo llamaba nadie desde la plantilla. Con el
metodo se va tambien el Router, que solo se usaba ahi.

Si la consulta de la solicitud activa falla, antes solo se apagaba el
cargando y la pantalla mostraba 'no tienes ningun servicio'. El cliente
veia lo mismo teniendo un servicio en curso que no teniendo ninguno.
Ahora el error vive en un signal, se muestra el aviso y hay boton de
Reintentar.

MENSAJE_ESTADO pasa de Record<string, string> a
Record<EstadoSolicitud, string>, para que TypeScript marque un dedazo en
el nombre de un estado y avise si el equipo agrega uno nuevo."
```

## PASO 4 — Atribución

```bash
git tag antes-de-atribuir
git rebase --exec "git commit --amend --no-edit --trailer 'Co-authored-by: Freidy <utti232036@utvco.edu.mx>'" HEAD~5
```

Si truena: `git reset --hard antes-de-atribuir` y me dices.

## PASO 5 — Subir

```bash
git push origin front-luz
```

---

## LO QUE TIENES QUE VER CON TUS PROPIOS OJOS

```bash
npm start
```

1. Entrar como **cliente**, pedir un servicio, y ver que aparezca en tu home.
2. Entrar como **MECÁNICO** y confirmar que su panel sigue jalando. El paquete
   sobreescribió `solicitud.service.ts` y `mecanico.service.ts`, que usan los dos.
3. Que el título de la barra de arriba cambie al moverte entre Inicio, Mi perfil
   y Solicitar servicio.
4. Provocar el error del home a propósito: en las herramientas del navegador,
   pestaña Red, ponlo en "sin conexión" y recarga. Debe salir el aviso rojo con
   el botón Reintentar, no la pantalla de "no tienes ningún servicio".

## UNA COSA QUE DEJÉ FUERA A PROPÓSITO

`cancelar()` tiene el mismo defecto que arreglamos en `cargar()`: si falla,
apaga el "cancelando" y ya. El cliente pica Cancelar, no pasa nada, y no sabe
por qué. Es el mismo arreglo (un signal de error y un aviso).

No lo metí porque tú pediste tres cosas concretas y ese commit es tuyo: no me
pareció bien colarte un cuarto cambio que no acordamos. Dime si lo quieres y
lo hacemos.
