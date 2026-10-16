const zonasRepository = require('../repositories/zonasRepository');

const listarZonas = async () => {
  return await zonasRepository.getAllZonas();
};

const registrarZona = async (datos) => {
  const { nombre_zona } = datos;
  return await zonasRepository.insertZona(nombre_zona);
};

const actualizarZona = async (id, datos) => {
  const { nombre_zona } = datos;
  const zonaActualizada = await zonasRepository.updateZona(id, nombre_zona);

  if (!zonaActualizada) {
    const error = new Error('Zona no encontrada');
    error.status = 404;
    throw error;
  }

  return zonaActualizada;
};

const eliminarZona = async (id) => {
  try {
    const zonaEliminada = await zonasRepository.deleteZona(id);

    if (!zonaEliminada) {
      const error = new Error('Zona no encontrada');
      error.status = 404;
      throw error;
    }

    return true;
  } catch (error) {
    if (error.code === '23503') {
      const customError = new Error('No se puede eliminar: Hay familias registradas en esta zona.');
      customError.status = 400;
      throw customError;
    }
    throw error;
  }
};

module.exports = {
  listarZonas,
  registrarZona,
  actualizarZona,
  eliminarZona
};