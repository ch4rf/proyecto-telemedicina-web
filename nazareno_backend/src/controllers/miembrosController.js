const miembrosService = require('../services/miembrosService');

// GET: Obtener todos los miembros
const obtenerMiembros = async (req, res) => {
  try {
    const miembros = await miembrosService.listarMiembros();
    res.status(200).json(miembros);
  } catch (error) {
    console.error('Error al obtener miembros:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor al consultar miembros' });
  }
};

// POST: Registrar un nuevo miembro
const crearMiembro = async (req, res) => {
  try {
    const nuevoMiembro = await miembrosService.registrarMiembro(req.body);
    res.status(201).json({ mensaje: 'Miembro registrado', data: nuevoMiembro });
  } catch (error) {
    console.error('Error al registrar miembro:', error);
    res.status(500).json({ mensaje: 'Error interno al registrar' });
  }
};

// PUT: Actualizar un miembro existente
const actualizarMiembro = async (req, res) => {
  try {
    const { id } = req.params;
    await miembrosService.actualizarMiembro(id, req.body);
    res.status(200).json({ mensaje: 'Miembro actualizado' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno al actualizar';

    if (!error.status) {
      console.error('Error al actualizar miembro:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Eliminar un miembro
const eliminarMiembro = async (req, res) => {
  try {
    const { id } = req.params;
    await miembrosService.eliminarMiembro(id);
    res.status(200).json({ mensaje: 'Miembro eliminado con éxito' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno del servidor al eliminar';

    if (!error.status) {
      console.error('Error al eliminar miembro:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// GET: Obtener los ministerios activos de un miembro específico
const obtenerMinisteriosDeMiembro = async (req, res) => {
  try {
    const { id } = req.params;
    const ministerios = await miembrosService.listarMinisteriosDeMiembro(id);
    res.status(200).json(ministerios);
  } catch (error) {
    console.error('Error al obtener ministerios del miembro:', error);
    res.status(500).json({ mensaje: 'Error interno al consultar ministerios' });
  }
};

module.exports = {
  obtenerMiembros,
  crearMiembro,
  actualizarMiembro,
  eliminarMiembro,
  obtenerMinisteriosDeMiembro
};