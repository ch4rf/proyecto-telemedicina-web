const estadosRepository = require('../repositories/estadosRepository');

// Obtener listado de estados de miembros
const obtenerEstados = async () => {
  return await estadosRepository.getAllEstados();
};

module.exports = {
  obtenerEstados
};