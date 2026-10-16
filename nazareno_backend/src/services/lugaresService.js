const lugaresRepository = require('../repositories/lugaresRepository');

// Obtener listado de lugares
const listarLugares = async () => {
  return await lugaresRepository.getAllLugares();
};

// Registrar nuevo lugar
const registrarLugar = async (datos) => {
  const { nombre, requiere_anfitrion } = datos;
  return await lugaresRepository.insertLugar(nombre, requiere_anfitrion);
};

// Actualizar lugar existente
const actualizarLugar = async (id, datos) => {
  const { nombre, requiere_anfitrion } = datos;
  const lugarActualizado = await lugaresRepository.updateLugar(id, nombre, requiere_anfitrion);

  if (!lugarActualizado) {
    const error = new Error('No encontrado');
    error.status = 404;
    throw error;
  }

  return lugarActualizado;
};

// Eliminar lugar con control de integridad referencial
const eliminarLugar = async (id) => {
  try {
    const lugarEliminado = await lugaresRepository.deleteLugar(id);

    if (!lugarEliminado) {
      const error = new Error('No encontrado');
      error.status = 404;
      throw error;
    }

    return true;
  } catch (error) {
    if (error.code === '23503') {
      const customError = new Error('En uso en una actividad.');
      customError.status = 400;
      throw customError;
    }
    throw error;
  }
};

module.exports = {
  listarLugares,
  registrarLugar,
  actualizarLugar,
  eliminarLugar
};