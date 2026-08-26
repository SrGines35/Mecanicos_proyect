# 1. Etapa de compilación de Angular
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Etapa de producción
FROM node:22-alpine
WORKDIR /app

# Instalamos serve globalmente
RUN npm install -g serve

# Copiamos exactamente la ruta que descubrimos que genera Angular
COPY --from=builder /app/dist/frontend/browser /app/public

EXPOSE 8080

# Servimos exactamente la carpeta public en el puerto 8080
CMD ["serve", "-s", "/app/public", "-l", "8080"]
