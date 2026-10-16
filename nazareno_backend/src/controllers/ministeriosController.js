const ministeriosService = require('../services/ministeriosService');

// GET: Obtener todos los ministerios
const obtenerMinisterios = async (req, res) => {
  try {
    const ministerios = await ministeriosService.listarMinisterios();
    res.status(200).json(ministerios);
  } catch (error) {
    console.error('Error al cargar ministerios:', error);
    res.status(500).json({ mensaje: 'Error al cargar ministerios' });
  }
};

// POST: Crear un nuevo ministerio
const crearMinisterio = async (req, res) => {
  try {
    const nuevoMinisterio = await ministeriosService.registrarMinisterio(req.body);
    res.status(201).json({ mensaje: 'Ministerio creado', data: nuevoMinisterio });
  } catch (error) {
    console.error('Error al crear ministerio:', error);
    res.status(500).json({ mensaje: 'Error al crear ministerio' });
  }
};

// PUT: Editar el nombre de un ministerio
const actualizarMinisterio = async (req, res) => {
  try {
    const { id } = req.params;
    await ministeriosService.actualizarMinisterio(id, req.body);
    res.status(200).json({ mensaje: 'Ministerio actualizado' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error al actualizar ministerio';

    if (!error.status) {
      console.error('Error al actualizar ministerio:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Eliminar un ministerio
const eliminarMinisterio = async (req, res) => {
  try {
    const { id } = req.params;
    await ministeriosService.eliminarMinisterio(id);
    res.status(200).json({ mensaje: 'Ministerio eliminado' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno al eliminar ministerio';

    if (!error.status) {
      console.error('Error al eliminar ministerio:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// GET: Obtener historial de un ministerio
const obtenerHistorialMinisterio = async (req, res) => {
  try {
    const { id } = req.params;
    const { filtro } = req.query;
    const historial = await ministeriosService.consultarHistorial(id, filtro);
    res.status(200).json(historial);
  } catch (error) {
    console.error('Error al cargar historial:', error);
    res.status(500).json({ mensaje: 'Error al cargar historial' });
  }
};

// POST: Vincular un miembro al ministerio
const vincularMiembroMinisterio = async (req, res) => {
  try {
    await ministeriosService.vincularMiembro(req.body);
    res.status(201).json({ mensaje: 'Vinculado correctamente' });
  } catch (error) {
    console.error('Error al vincular miembro:', error);
    res.status(500).json({ mensaje: 'Error al vincular miembro' });
  }
};

// PUT: Dar de baja de un ministerio
const darDeBajaMinisterio = async (req, res) => {
  try {
    const { id_historial } = req.params;
    const { fecha_fin } = req.body;
    await ministeriosService.darDeBaja(id_historial, fecha_fin);
    res.status(200).json({ mensaje: 'Ciclo cerrado correctamente' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error al actualizar estado';

    if (!error.status) {
      console.error('Error al dar de baja:', error);
    }
    res.status(status).json({ mensaje });
  }
};

module.exports = {
  obtenerMinisterios,
  crearMinisterio,
  actualizarMinisterio,
  eliminarMinisterio,
  obtenerHistorialMinisterio,
  vincularMiembroMinisterio,
  darDeBajaMinisterio
};