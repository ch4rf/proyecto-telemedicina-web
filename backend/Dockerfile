# Dockerfile de Producción - Backend API & Socket.io (NovaSalud Telemedicina)
FROM node:20-alpine

WORKDIR /app

# Zona horaria oficial para registros clínicos y bitácora RFID
ENV NODE_ENV=production
ENV TZ=America/Guatemala
ENV PORT=4000

# Instalar dependencias de producción aprovechando la caché de capas
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copiar el código fuente del servidor
COPY src ./src

EXPOSE 4000

CMD ["node", "src/server.js"]
