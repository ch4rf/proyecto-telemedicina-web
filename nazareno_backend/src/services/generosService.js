const generosRepository = require('../repositories/generosRepository');

// Obtener listado de géneros
const obtenerGeneros = async () => {
  return await generosRepository.getAllGeneros();
};

module.exports = {
  obtenerGeneros
};