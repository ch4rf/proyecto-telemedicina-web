const tiposActividadRepository = require('../repositories/tiposActividadRepository');

const listarTiposActividad = async () => {
  return await tiposActividadRepository.getAllTiposActividad();
};

const registrarTipoActividad = async (datos) => {
  return await tiposActividadRepository.insertTipoActividad(datos.descripcion);
};

const actualizarTipoActividad = async (id, datos) => {
  const tipoActualizado = await tiposActividadRepository.updateTipoActividad(id, datos.descripcion);
  if (!tipoActualizado) {
    const error = new Error('Tipo de actividad no encontrado');
    error.status = 404;
    throw error;
  }
  return tipoActualizado;
};

const eliminarTipoActividad = async (id) => {
  try {
    const tipoEliminado = await tiposActividadRepository.deleteTipoActividad(id);
    if (!tipoEliminado) {
      const error = new Error('Tipo de actividad no encontrado');
      error.status = 404;
      throw error;
    }
    return true;
  } catch (error) {
    if (error.code === '23503') {
      const customError = new Error('No se puede eliminar: Hay miembros o actividades asignadas a este tipo de actividad.');
      customError.status = 400;
      throw customError;
    }
    throw error;
  }
};

module.exports = {
  listarTiposActividad,
  registrarTipoActividad,
  actualizarTipoActividad,
  eliminarTipoActividad
};