const zonasService = require('../services/zonasService');

// GET: Obtener todas las zonas
const obtenerZonas = async (req, res) => {
  try {
    const zonas = await zonasService.listarZonas();
    res.status(200).json(zonas);
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor al consultar zonas' });
  }
};

// POST: Crear nueva zona
const crearZona = async (req, res) => {
  try {
    const nuevaZona = await zonasService.registrarZona(req.body);
    res.status(201).json({ mensaje: 'Zona creada con éxito', data: nuevaZona });
  } catch (error) {
    console.error('Error al crear zona:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// PUT: Editar zona existente
const editarZona = async (req, res) => {
  try {
    const { id } = req.params;
    const zonaActualizada = await zonasService.actualizarZona(id, req.body);
    res.status(200).json({ mensaje: 'Zona actualizada', data: zonaActualizada });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno del servidor';

    if (!error.status) {
      console.error('Error al editar zona:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Borrar zona
const eliminarZona = async (req, res) => {
  try {
    const { id } = req.params;
    await zonasService.eliminarZona(id);
    res.status(200).json({ mensaje: 'Zona eliminada con éxito' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno del servidor';

    if (!error.status) {
      console.error('Error al eliminar zona:', error);
    }
    res.status(status).json({ mensaje });
  }
};

module.exports = {
  obtenerZonas,
  crearZona,
  editarZona,
  eliminarZona
};