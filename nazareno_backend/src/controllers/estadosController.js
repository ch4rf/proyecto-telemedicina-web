const estadosService = require('../services/estadosService');

// GET: Obtener estados
const obtenerEstados = async (req, res) => {
  try {
    const estados = await estadosService.obtenerEstados();
    res.status(200).json(estados);
  } catch (error) {
    console.error('Error al obtener estados:', error);
    res.status(500).json({ mensaje: 'Error al obtener estados' });
  }
};

module.exports = {
  obtenerEstados
};