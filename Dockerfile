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
COPY --from=builder /app/dist/frontend/browser /app/public

# 6. Exponer puerto y correr el servidor estático
EXPOSE 3000
CMD ["serve", "-s", "public", "-l", "3000"]
