const pool = require('../config/db');

// Obtener catalogo de estados de miembros
const getAllEstados = async () => {
  const query = 'SELECT id_estado AS id, descripcion FROM cat_estado_miembro;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

module.exports = {
  getAllEstados
};