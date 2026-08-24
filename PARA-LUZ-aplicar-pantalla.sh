#!/usr/bin/env bash
set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAR="$AQUI/cliente-pantalla.tar.gz"
PAYLOAD="$AQUI/_pantalla/files"
RAMA="front-luz"

export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=core.autocrlf
export GIT_CONFIG_VALUE_0=input

echo "=============================================="
echo " Pantalla para pedir un mecanico"
echo "=============================================="
echo

if [ -d "$AQUI/.git" ]; then
  REPO="$AQUI"
elif [ -d "$AQUI/App_mecanicos/.git" ]; then
  REPO="$AQUI/App_mecanicos"
else
  echo "ERROR: no encuentro el repositorio."
  echo "Pon este archivo y el .tar.gz DENTRO de la carpeta App_mecanicos"
  echo "y vuelve a correrlo desde ahi."
  exit 1
fi

[ -f "$TAR" ] || { echo "ERROR: falta cliente-pantalla.tar.gz junto a este archivo"; exit 1; }

echo "Repositorio: $REPO"
echo "Descomprimiendo el paquete..."
rm -rf "$AQUI/_pantalla"; mkdir -p "$AQUI/_pantalla"
tar -xzf "$TAR" -C "$AQUI/_pantalla"

cd "$REPO"
rm -f .git/HEAD.lock .git/index.lock 2>/dev/null || true

echo "Cambiando a la rama $RAMA..."
git checkout -q "$RAMA"
git config core.autocrlf input

if ! git diff --quiet -- package.json package-lock.json; then
  echo "Regresando package.json y package-lock.json como estaban (los movio npm)..."
  git checkout -q -- package.json package-lock.json
fi

if ! git diff --quiet -- src || ! git diff --cached --quiet; then
  echo
  echo "AVISO: tienes cambios sin guardar."
  git status --short
  echo
  echo "Guardalos con un commit o descartalos, y vuelve a correr esto."
  exit 1
fi

PUNTO_ANTERIOR="$(git rev-parse HEAD)"
echo "Punto de regreso por si algo sale mal: $PUNTO_ANTERIOR"
echo

hacer_commit() {
  if git diff --cached --quiet; then
    echo "  (sin cambios) ya estaba aplicado"
  else
    git commit -q -F -
    echo "  commit hecho"
  fi
}

# ---------------------------------------------------------------------------
echo "[1/3] La pantalla para pedir un mecanico"

mkdir -p src/app/features/usuario/solicitar-servicio
cp "$PAYLOAD/src/app/features/usuario/solicitar-servicio/solicitar-servicio.ts"   src/app/features/usuario/solicitar-servicio/
cp "$PAYLOAD/src/app/features/usuario/solicitar-servicio/solicitar-servicio.html" src/app/features/usuario/solicitar-servicio/
cp "$PAYLOAD/src/app/features/usuario/solicitar-servicio/solicitar-servicio.css"  src/app/features/usuario/solicitar-servicio/
git add src/app/features/usuario/solicitar-servicio

hacer_commit <<'MSG'
feat(usuario): la pantalla para pedir un mecanico

Estaba vacia: el componente traia nada mas el andamio del CLI, asi que el
boton "Solicitar mecanico" del inicio llevaba a una pantalla en blanco.

Tres pasos en una sola vista:

  1. Donde estas. Se intenta el GPS al entrar y, si falla, el pin del mapa
     se arrastra. La ubicacion vive en una señal, no en el formulario, y la
     pueden llenar los dos caminos: asi el GPS deja de ser indispensable.
  2. Vehiculo y falla, con validacion y contador de caracteres.
  3. Los mecanicos disponibles, del mas cercano al mas lejano.

La distancia la calcula el front con Haversine, reutilizando
core/utils/distancia.util.ts. El back solo devuelve coordenadas y no
necesita consultas geograficas.

El mapa es el mismo shared/mapa-ubicacion que usa el mecanico en su perfil,
con [editable]="true". No se duplico nada.
MSG
echo

# ---------------------------------------------------------------------------
echo "[2/3] Sin comentarios en el codigo"

cp "$PAYLOAD/quitar-comentarios.mjs" ./_quitar-comentarios.mjs
node ./_quitar-comentarios.mjs
rm -f ./_quitar-comentarios.mjs

git add src
hacer_commit <<'MSG'
chore: quita los comentarios que quedaban en el codigo

Acuerdo del equipo. Faltaban los de app.routes.ts, que se quedo con la
version de esta rama al resolver el merge.
MSG
echo

# ---------------------------------------------------------------------------
echo "[3/3] Sacando la carpeta temporal _fix-home del repositorio"

if git ls-files --error-unmatch _fix-home > /dev/null 2>&1; then
  git rm -r -q --cached _fix-home
  grep -qx "_fix-home/" .gitignore 2>/dev/null || echo "_fix-home/" >> .gitignore
  git add .gitignore
  hacer_commit <<'MSG'
chore: saca del repositorio la carpeta temporal _fix-home

Eran archivos de trabajo, no del proyecto. Se quedan en el disco pero
dejan de subirse.
MSG
else
  echo "  (sin cambios) ya no estaba en el repositorio"
fi
echo

# ---------------------------------------------------------------------------
echo "=============================================="
NUEVOS="$(git rev-list --count "$PUNTO_ANTERIOR"..HEAD)"
echo " Listo: $NUEVOS commits nuevos"
echo "=============================================="
git log --oneline "$PUNTO_ANTERIOR"..HEAD
echo
echo "Ahora, en PowerShell:   npm run build"
echo "Si compila bien:        git push origin $RAMA"
echo
echo "Si algo salio mal:      git reset --hard $PUNTO_ANTERIOR"
