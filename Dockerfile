# Usa una imagen oficial de Node.js ligera
FROM node:20-alpine

# Crea y define el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de paquetes primero (para aprovechar el caché de Docker)
COPY nazareno_backend/package*.json ./nazareno_backend/

# Instala las dependencias del backend
WORKDIR /usr/src/app/nazareno_backend
RUN npm install

# Vuelve a la raíz del app
WORKDIR /usr/src/app

# Copia todo el código del backend y del frontend
COPY nazareno_backend/ ./nazareno_backend/
COPY nazareno_frontend/ ./nazareno_frontend/

# Entra a la carpeta del backend donde se ejecuta el código
WORKDIR /usr/src/app/nazareno_backend

# Expone el puerto que usa el backend
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "src/index.js"]
