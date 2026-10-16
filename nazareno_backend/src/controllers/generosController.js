const generosService = require('../services/generosService');

// GET: Obtener géneros
const obtenerGeneros = async (req, res) => {
  try {
    const generos = await generosService.obtenerGeneros();
    res.status(200).json(generos);
  } catch (error) {
    console.error('Error al obtener géneros:', error);
    res.status(500).json({ mensaje: 'Error al obtener géneros' });
  }
};

module.exports = {
  obtenerGeneros
};