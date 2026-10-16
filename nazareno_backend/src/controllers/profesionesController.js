const profesionesService = require('../services/profesionesService');

// GET: Obtener profesiones
const obtenerProfesiones = async (req, res) => {
  try {
    const profesiones = await profesionesService.listarProfesiones();
    res.status(200).json(profesiones);
  } catch (error) {
    console.error('Error al obtener profesiones:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// POST: Crear profesion
const crearProfesion = async (req, res) => {
  try {
    const nuevaProfesion = await profesionesService.registrarProfesion(req.body);
    res.status(201).json({ mensaje: 'Profesión creada', data: nuevaProfesion });
  } catch (error) {
    console.error('Error al crear profesión:', error);
    res.status(500).json({ mensaje: 'Error al crear' });
  }
};

// PUT: Editar profesion
const editarProfesion = async (req, res) => {
  try {
    const { id } = req.params;
    const profesionActualizada = await profesionesService.actualizarProfesion(id, req.body);
    res.status(200).json({ mensaje: 'Profesión actualizada', data: profesionActualizada });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error al editar';

    if (!error.status) {
      console.error('Error al editar profesión:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Eliminar profesion
const eliminarProfesion = async (req, res) => {
  try {
    const { id } = req.params;
    await profesionesService.eliminarProfesion(id);
    res.status(200).json({ mensaje: 'Profesión eliminada' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error al eliminar';

    if (!error.status) {
      console.error('Error al eliminar profesión:', error);
    }
    res.status(status).json({ mensaje });
  }
};

module.exports = {
  obtenerProfesiones,
  crearProfesion,
  editarProfesion,
  eliminarProfesion
};