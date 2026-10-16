const familiasService = require('../services/familiasService');

// GET: Obtener todas las familias
const obtenerFamilias = async (req, res) => {
  try {
    const familias = await familiasService.listarFamilias();
    res.status(200).json(familias);
  } catch (error) {
    console.error('Error al obtener familias:', error);
    res.status(500).json({ mensaje: 'Error interno al consultar familias' });
  }
};

// POST: Registrar una nueva familia
const crearFamilia = async (req, res) => {
  try {
    const nuevaFamilia = await familiasService.registrarFamilia(req.body);
    res.status(201).json({ mensaje: 'Familia registrada con éxito', data: nuevaFamilia });
  } catch (error) {
    console.error('Error al registrar familia:', error);
    res.status(500).json({ mensaje: 'Error interno al registrar familia' });
  }
};

// PUT: Actualizar una familia existente
const actualizarFamilia = async (req, res) => {
  try {
    const { id } = req.params;
    await familiasService.actualizarFamilia(id, req.body);
    res.status(200).json({ mensaje: 'Familia actualizada con éxito' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno al actualizar familia';

    if (!error.status) {
      console.error('Error al actualizar familia:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Eliminar una familia
const eliminarFamilia = async (req, res) => {
  try {
    const { id } = req.params;
    await familiasService.eliminarFamilia(id);
    res.status(200).json({ mensaje: 'Familia eliminada con éxito' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno al eliminar familia';

    if (!error.status) {
      console.error('Error al eliminar familia:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// GET: Obtener los integrantes asociados a una familia específica
const obtenerIntegrantesFamilia = async (req, res) => {
  try {
    const { id } = req.params;
    const integrantes = await familiasService.listarIntegrantesFamilia(id);
    res.status(200).json(integrantes);
  } catch (error) {
    console.error('Error al obtener integrantes de la familia:', error);
    res.status(500).json({ mensaje: 'Error interno al consultar integrantes' });
  }
};

module.exports = {
  obtenerFamilias,
  crearFamilia,
  actualizarFamilia,
  eliminarFamilia,
  obtenerIntegrantesFamilia
};