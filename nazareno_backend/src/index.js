const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Inicializamos la aplicación
const app = express();

// Middlewares base
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
const frontendPath = path.join(__dirname, '../../nazareno_frontend');
app.use(express.static(frontendPath));

// Verificación de conexión a la base de datos
require('./config/db');

// Registro de rutas API
app.use('/api', require('./routes'));

// Middlewares de control de errores (deben ir siempre después de las rutas)
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);

// Arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`Prueba abriendo: http://localhost:${PORT}`);
});