# 1. Etapa de compilación
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Etapa de producción usando un servidor http-server o serve bien configurado
FROM node:22-alpine
WORKDIR /app

# Instalamos serve globalmente
RUn npm install -g serve

# Copiamos la build de Angular a /app
COPY --from=builder /app/dist/frontend /app

EXPOSE 8080

# Ejecutamos serve apuntando al directorio actual (.) donde está el index.html y los archivos compilados
CMD ["serve", "-s", ".", "-l", "8080"]
