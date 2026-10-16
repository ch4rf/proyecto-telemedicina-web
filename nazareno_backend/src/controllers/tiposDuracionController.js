const tiposDuracionService = require('../services/tiposDuracionService');

// GET: Obtener tipos de duracion
const obtenerTiposDuracion = async (req, res) => {
  try {
    const tipos = await tiposDuracionService.listarTiposDuracion();
    res.status(200).json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de duración:', error);
    res.status(500).json({ mensaje: 'Error al obtener tipos de duración' });
  }
};

// POST: Crear tipo de duracion
const crearTiposDuracion = async (req, res) => {
  try {
    const nuevoTipo = await tiposDuracionService.registrarTipoDuracion(req.body);
    res.status(201).json({ mensaje: 'Tipo de duración creado', data: nuevoTipo });
  } catch (error) {
    console.error('Error al crear tipo de duración:', error);
    res.status(500).json({ mensaje: 'Error al crear tipo' });
  }
};

// PUT: Editar tipo de duracion
const editarTiposDuracion = async (req, res) => {
  try {
    const { id } = req.params;
    const tipoActualizado = await tiposDuracionService.actualizarTipoDuracion(id, req.body);
    res.status(200).json({ mensaje: 'Tipo actualizado', data: tipoActualizado });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error al editar tipo';

    if (!error.status) {
      console.error('Error al editar tipo de duración:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Eliminar tipo de duracion
const eliminarTiposDuracion = async (req, res) => {
  try {
    const { id } = req.params;
    await tiposDuracionService.eliminarTipoDuracion(id);
    res.status(200).json({ mensaje: 'Tipo eliminado' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error al eliminar tipo';

    if (!error.status) {
      console.error('Error al eliminar tipo de duración:', error);
    }
    res.status(status).json({ mensaje });
  }
};

module.exports = {
  obtenerTiposDuracion,
  crearTiposDuracion,
  editarTiposDuracion,
  eliminarTiposDuracion
};