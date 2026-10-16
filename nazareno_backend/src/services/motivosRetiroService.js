const motivosRetiroRepository = require('../repositories/motivosRetiroRepository');

const listarMotivosRetiro = async () => {
  return await motivosRetiroRepository.getAllMotivosRetiro();
};

const registrarMotivoRetiro = async (datos) => {
  return await motivosRetiroRepository.insertMotivoRetiro(datos.descripcion);
};

const actualizarMotivoRetiro = async (id, datos) => {
  const motivoActualizado = await motivosRetiroRepository.updateMotivoRetiro(id, datos.descripcion);
  if (!motivoActualizado) {
    const error = new Error('Motivo de retiro no encontrado');
    error.status = 404;
    throw error;
  }
  return motivoActualizado;
};

const eliminarMotivoRetiro = async (id) => {
  try {
    const motivoEliminado = await motivosRetiroRepository.deleteMotivoRetiro(id);
    if (!motivoEliminado) {
      const error = new Error('Motivo de retiro no encontrado');
      error.status = 404;
      throw error;
    }
    return true;
  } catch (error) {
    if (error.code === '23503') {
      const customError = new Error('No se puede eliminar: Hay miembros o actividades asignadas a este motivo de retiro.');
      customError.status = 400;
      throw customError;
    }
    throw error;
  }
};

module.exports = {
  listarMotivosRetiro,
  registrarMotivoRetiro,
  actualizarMotivoRetiro,
  eliminarMotivoRetiro
};