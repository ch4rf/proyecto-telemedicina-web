const familiasRepository = require('../repositories/familiasRepository');

const listarFamilias = async () => {
  return await familiasRepository.getAllFamilias();
};

const registrarFamilia = async (datos) => {
  return await familiasRepository.insertFamilia(datos);
};

const actualizarFamilia = async (id, datos) => {
  const familiaActualizada = await familiasRepository.updateFamilia(id, datos);
  if (!familiaActualizada) {
    const error = new Error('Familia no encontrada');
    error.status = 404;
    throw error;
  }
  return familiaActualizada;
};

const eliminarFamilia = async (id) => {
  try {
    const familiaEliminada = await familiasRepository.deleteFamilia(id);
    if (!familiaEliminada) {
      const error = new Error('Familia no encontrada');
      error.status = 404;
      throw error;
    }
    return true;
  } catch (error) {
    // Código de violación de clave foránea en PostgreSQL (familia con miembros)
    if (error.code === '23503') {
      const customError = new Error('No se puede eliminar: Esta familia ya tiene miembros asignados.');
      customError.status = 400;
      throw customError;
    }
    throw error;
  }
};

const listarIntegrantesFamilia = async (id) => {
  return await familiasRepository.getIntegrantesByFamiliaId(id);
};

module.exports = {
  listarFamilias,
  registrarFamilia,
  actualizarFamilia,
  eliminarFamilia,
  listarIntegrantesFamilia
};