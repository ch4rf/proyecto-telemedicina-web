const lugaresService = require('../services/lugaresService');

// GET: Obtener lugares
const obtenerLugares = async (req, res) => {
  try {
    const lugares = await lugaresService.listarLugares();
    res.status(200).json(lugares);
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ mensaje: 'Error al obtener lugares' });
  }
};

// POST: Crear nuevo lugar
const crearLugares = async (req, res) => {
  try {
    const nuevoLugar = await lugaresService.registrarLugar(req.body);
    res.status(201).json({ mensaje: 'Lugar creado', data: nuevoLugar });
  } catch (error) {
    console.error('Error al crear lugar:', error);
    res.status(500).json({ mensaje: 'Error al crear lugar' });
  }
};

// PUT: Actualizar lugar existente
const editarLugares = async (req, res) => {
  try {
    const { id } = req.params;
    const lugarActualizado = await lugaresService.actualizarLugar(id, req.body);
    res.status(200).json({ mensaje: 'Lugar actualizado', data: lugarActualizado });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error al editar lugar';

    if (!error.status) {
      console.error('Error al editar lugar:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Eliminar un lugar
const eliminarLugares = async (req, res) => {
  try {
    const { id } = req.params;
    await lugaresService.eliminarLugar(id);
    res.status(200).json({ mensaje: 'Lugar eliminado' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error al eliminar lugar';

    if (!error.status) {
      console.error('Error al eliminar lugar:', error);
    }
    res.status(status).json({ mensaje });
  }
};

module.exports = {
  obtenerLugares,
  crearLugares,
  editarLugares,
  eliminarLugares
};