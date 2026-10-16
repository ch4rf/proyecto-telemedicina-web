const tiposRecepcionRepository = require('../repositories/tiposRecepcionRepository');

const listarTiposRecepcion = async () => {
  return await tiposRecepcionRepository.getAllTiposRecepcion();
};

const registrarTipoRecepcion = async (datos) => {
  const { nombre } = datos;
  return await tiposRecepcionRepository.insertTipoRecepcion(nombre);
};

const actualizarTipoRecepcion = async (id, datos) => {
  const { nombre } = datos;
  const tipoActualizado = await tiposRecepcionRepository.updateTipoRecepcion(id, nombre);

  if (!tipoActualizado) {
    const error = new Error('Tipo de recepcion no encontrado');
    error.status = 404;
    throw error;
  }

  return tipoActualizado;
};

const eliminarTipoRecepcion = async (id) => {
  try {
    const tipoEliminado = await tiposRecepcionRepository.deleteTipoRecepcion(id);

    if (!tipoEliminado) {
      const error = new Error('Tipo de recepcion no encontrado');
      error.status = 404;
      throw error;
    }

    return true;
  } catch (error) {
    if (error.code === '23503') {
      const customError = new Error('No se puede eliminar: Hay miembros o actividades asignadas a este tipo de recepcion.');
      customError.status = 400;
      throw customError;
    }
    throw error;
  }
};

module.exports = {
  listarTiposRecepcion,
  registrarTipoRecepcion,
  actualizarTipoRecepcion,
  eliminarTipoRecepcion
};