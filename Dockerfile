# 1. Usar una versión de Node.js oficial y moderna que Angular acepta sin chistar
FROM node:22-alpine AS builder

# 2. Establecer directorio de trabajo
WORKDIR /app

# 3. Copiar dependencias e instalarlas
COPY package*.json ./
RUN npm ci

# 4. Copiar todo el código y compilar Angular
COPY . .
RUN npm run build

# 5. Servidor ligero para servir la app de Angular
FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist /app/public

# 6. Exponer puerto y correr el servidor estático
# 6. Exponer puerto y correr el servidor estático en el puerto 8080 que pide Railway
# 6. Exponer y escuchar el puerto dinámico que Railway asigna
# 6. Exponer, listar carpetas para depurar y arrancar
EXPOSE 8080
CMD sh -c "echo '=== CONTENIDO DE DIST ===' && ls -R /app/dist && PORT=${PORT:-8080} && (serve -s /app/dist/frontend/browser -l $PORT || serve -s /app/dist/browser -l $PORT || serve -s /app/dist -l $PORT)"
