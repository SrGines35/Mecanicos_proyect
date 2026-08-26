# 1. Etapa de compilación
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Etapa de producción
FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve

COPY --from=builder /app/dist/frontend /app/public

EXPOSE 8080

# Arrancamos serve apuntando directamente a /app/public
CMD ["serve", "-s", "/app/public", "-l", "8080"]
