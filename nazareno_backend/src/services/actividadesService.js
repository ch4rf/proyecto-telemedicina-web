const actividadesRepository = require('../repositories/actividadesRepository');

const obtenerDatosFormulario = async () => {
  return await actividadesRepository.getDatosFormulario();
};

const obtenerActividades = async () => {
  return await actividadesRepository.getAllActividades();
};

const crearActividad = async (datos) => {
  return await actividadesRepository.insertActividad(datos);
};

const eliminarActividad = async (id) => {
  return await actividadesRepository.deleteActividad(id);
};

const actualizarActividad = async (id, datos) => {
  return await actividadesRepository.updateActividad(id, datos);
};

module.exports = {
  obtenerDatosFormulario,
  obtenerActividades,
  crearActividad,
  eliminarActividad,
  actualizarActividad
};