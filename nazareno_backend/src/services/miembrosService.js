const miembrosRepository = require('../repositories/miembrosRepository');

const listarMiembros = async () => {
  return await miembrosRepository.getAllMiembros();
};

const registrarMiembro = async (datos) => {
  return await miembrosRepository.insertMiembro(datos);
};

const actualizarMiembro = async (id, datos) => {
  const miembroActualizado = await miembrosRepository.updateMiembro(id, datos);
  if (!miembroActualizado) {
    const error = new Error('Miembro no encontrado');
    error.status = 404;
    throw error;
  }
  return miembroActualizado;
};

const eliminarMiembro = async (id) => {
  try {
    const miembroEliminado = await miembrosRepository.deleteMiembro(id);
    if (!miembroEliminado) {
      const error = new Error('Miembro no encontrado');
      error.status = 404;
      throw error;
    }
    return true;
  } catch (error) {
    if (error.code === '23503') {
      const customError = new Error('No se puede eliminar: El miembro tiene registros asociados.');
      customError.status = 400;
      throw customError;
    }
    throw error;
  }
};

const listarMinisteriosDeMiembro = async (id) => {
  return await miembrosRepository.getMinisteriosActivosByMiembroId(id);
};

module.exports = {
  listarMiembros,
  registrarMiembro,
  actualizarMiembro,
  eliminarMiembro,
  listarMinisteriosDeMiembro
};