const tiposDuracionRepository = require('../repositories/tiposDuracionRepository');

const listarTiposDuracion = async () => {
  return await tiposDuracionRepository.getAllTiposDuracion();
};

const registrarTipoDuracion = async (datos) => {
  const { descripcion, requiere_hora } = datos;
  return await tiposDuracionRepository.insertTipoDuracion(descripcion, requiere_hora);
};

const actualizarTipoDuracion = async (id, datos) => {
  const { descripcion, requiere_hora } = datos;
  const tipoActualizado = await tiposDuracionRepository.updateTipoDuracion(id, descripcion, requiere_hora);

  if (!tipoActualizado) {
    const error = new Error('No encontrado');
    error.status = 404;
    throw error;
  }

  return tipoActualizado;
};

const eliminarTipoDuracion = async (id) => {
  try {
    const tipoEliminado = await tiposDuracionRepository.deleteTipoDuracion(id);

    if (!tipoEliminado) {
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
  listarTiposDuracion,
  registrarTipoDuracion,
  actualizarTipoDuracion,
  eliminarTipoDuracion
};