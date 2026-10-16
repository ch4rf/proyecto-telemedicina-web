const tiposActividadService = require('../services/tiposActividadService');

// GET: Leer tipos de actividad
const obtenerTiposActividad = async (req, res) => {
  try {
    const tipos = await tiposActividadService.listarTiposActividad();
    res.status(200).json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de actividad:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// POST: Crear tipo de actividad
const crearTiposActividad = async (req, res) => {
  try {
    const nuevoTipo = await tiposActividadService.registrarTipoActividad(req.body);
    res.status(201).json({ mensaje: 'Tipo de actividad creado con éxito', data: nuevoTipo });
  } catch (error) {
    console.error('Error al crear tipo de actividad:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// PUT: Editar tipo de actividad
const editarTiposActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const tipoActualizado = await tiposActividadService.actualizarTipoActividad(id, req.body);
    res.status(200).json({ mensaje: 'Tipo de actividad actualizado', data: tipoActualizado });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno del servidor';

    if (!error.status) {
      console.error('Error al editar tipo de actividad:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Borrar tipo de actividad
const eliminarTiposActividad = async (req, res) => {
  try {
    const { id } = req.params;
    await tiposActividadService.eliminarTipoActividad(id);
    res.status(200).json({ mensaje: 'Tipo de actividad eliminado con éxito' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno del servidor';

    if (!error.status) {
      console.error('Error al eliminar tipo de actividad:', error);
    }
    res.status(status).json({ mensaje });
  }
};

module.exports = {
  obtenerTiposActividad,
  crearTiposActividad,
  editarTiposActividad,
  eliminarTiposActividad
};