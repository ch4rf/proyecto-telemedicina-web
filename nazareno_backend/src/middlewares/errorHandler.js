// Middleware para rutas inexistentes (404)
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    mensaje: `La ruta ${req.originalUrl} no fue encontrada en este servidor`
  });
};

// Middleware global para captura y manejo de errores (500 u otros)
const errorHandler = (err, req, res, next) => {
  // Si no es un error controlado con código específico, lo registramos en consola
  if (!err.status || err.status === 500) {
    console.error('Error no controlado:', err);
  }

  const status = err.status || 500;
  const mensaje = err.message || 'Error interno del servidor';

  res.status(status).json({ mensaje });
};

module.exports = {
  notFoundHandler,
  errorHandler
};