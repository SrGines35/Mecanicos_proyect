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

# Copiamos el contenido exacto de la carpeta browser generada por Angular a una carpeta limpia /app/public
# (Aquí usaremos un comodín para asegurarnos de traer la carpeta correcta sin importar el nombre del proyecto)
COPY --from=builder /app/dist/*/browser /app/public

EXPOSE 8080

# Arrancamos serve apuntando directamente a /app/public
CMD ["serve", "-s", "/app/public", "-l", "8080"]
