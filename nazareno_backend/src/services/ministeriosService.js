const ministeriosRepository = require('../repositories/ministeriosRepository');

const listarMinisterios = async () => {
  return await ministeriosRepository.getAllMinisterios();
};

const registrarMinisterio = async (datos) => {
  return await ministeriosRepository.insertMinisterio(datos.nombre);
};

const actualizarMinisterio = async (id, datos) => {
  const ministerioActualizado = await ministeriosRepository.updateMinisterio(id, datos.nombre);
  if (!ministerioActualizado) {
    const error = new Error('Ministerio no encontrado');
    error.status = 404;
    throw error;
  }
  return ministerioActualizado;
};

const eliminarMinisterio = async (id) => {
  try {
    const ministerioEliminado = await ministeriosRepository.deleteMinisterio(id);
    if (!ministerioEliminado) {
      const error = new Error('Ministerio no encontrado');
      error.status = 404;
      throw error;
    }
    return true;
  } catch (error) {
    if (error.code === '23503') {
      const customError = new Error('No se puede eliminar: Hay miembros vinculados a este ministerio en el historial.');
      customError.status = 400;
      throw customError;
    }
    throw error;
  }
};

const consultarHistorial = async (id, filtro) => {
  return await ministeriosRepository.getHistorialByMinisterioId(id, filtro);
};

const vincularMiembro = async (datos) => {
  return await ministeriosRepository.insertMiembroMinisterio(datos);
};

const darDeBaja = async (idHistorial, fechaFin) => {
  const registro = await ministeriosRepository.updateBajaMinisterio(idHistorial, fechaFin);
  if (!registro) {
    const error = new Error('Registro de historial no encontrado');
    error.status = 404;
    throw error;
  }
  return registro;
};

module.exports = {
  listarMinisterios,
  registrarMinisterio,
  actualizarMinisterio,
  eliminarMinisterio,
  consultarHistorial,
  vincularMiembro,
  darDeBaja
};