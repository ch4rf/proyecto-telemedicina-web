const tiposRecepcionService = require('../services/tiposRecepcionService');

// GET: Leer tipos de recepcion
const obtenerTiposRecepcion = async (req, res) => {
  try {
    const tipos = await tiposRecepcionService.listarTiposRecepcion();
    res.status(200).json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de recepcion:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// POST: Crear tipo de recepcion
const crearTiposRecepcion = async (req, res) => {
  try {
    const nuevoTipo = await tiposRecepcionService.registrarTipoRecepcion(req.body);
    res.status(201).json({ mensaje: 'Tipo de recepcion creado con éxito', data: nuevoTipo });
  } catch (error) {
    console.error('Error al crear tipo de recepcion:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// PUT: Editar tipo de recepcion
const editarTiposRecepcion = async (req, res) => {
  try {
    const { id } = req.params;
    const tipoActualizado = await tiposRecepcionService.actualizarTipoRecepcion(id, req.body);
    res.status(200).json({ mensaje: 'Tipo de recepcion actualizado', data: tipoActualizado });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno del servidor';

    if (!error.status) {
      console.error('Error al editar tipo de recepcion:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Borrar tipo de recepcion
const eliminarTiposRecepcion = async (req, res) => {
  try {
    const { id } = req.params;
    await tiposRecepcionService.eliminarTipoRecepcion(id);
    res.status(200).json({ mensaje: 'Tipo de recepcion eliminado con éxito' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno del servidor';

    if (!error.status) {
      console.error('Error al eliminar tipo de recepcion:', error);
    }
    res.status(status).json({ mensaje });
  }
};

module.exports = {
  obtenerTiposRecepcion,
  crearTiposRecepcion,
  editarTiposRecepcion,
  eliminarTiposRecepcion
};