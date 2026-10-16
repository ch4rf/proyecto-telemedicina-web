const pool = require('../config/db');

// Obtener catálogo de géneros
const getAllGeneros = async () => {
  const query = 'SELECT id_genero AS id, descripcion FROM cat_genero;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

module.exports = {
  getAllGeneros
};