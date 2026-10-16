const profesionesRepository = require('../repositories/profesionesRepository');

const listarProfesiones = async () => {
  return await profesionesRepository.getAllProfesiones();
};

const registrarProfesion = async (datos) => {
  return await profesionesRepository.insertProfesion(datos.descripcion);
};

const actualizarProfesion = async (id, datos) => {
  const profesionActualizada = await profesionesRepository.updateProfesion(id, datos.descripcion);
  if (!profesionActualizada) {
    const error = new Error('No encontrada');
    error.status = 404;
    throw error;
  }
  return profesionActualizada;
};

const eliminarProfesion = async (id) => {
  try {
    const profesionEliminada = await profesionesRepository.deleteProfesion(id);
    if (!profesionEliminada) {
      const error = new Error('No encontrada');
      error.status = 404;
      throw error;
    }
    return true;
  } catch (error) {
    if (error.code === '23503') {
      const customError = new Error('En uso por un miembro.');
      customError.status = 400;
      throw customError;
    }
    throw error;
  }
};

module.exports = {
  listarProfesiones,
  registrarProfesion,
  actualizarProfesion,
  eliminarProfesion
};