const pool = require('../config/db');

// Obtener catalogo de tipos de actividad ordenado alfabeticamente
const getAllTiposActividad = async () => {
  const query = 'SELECT id_tipo AS id, descripcion FROM cat_tipo_actividad ORDER BY descripcion ASC;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar un nuevo tipo de actividad
const insertTipoActividad = async (descripcion) => {
  const query = 'INSERT INTO cat_tipo_actividad (descripcion) VALUES ($1) RETURNING *;';
  const resultado = await pool.query(query, [descripcion]);
  return resultado.rows[0];
};

// Actualizar un tipo de actividad por ID
const updateTipoActividad = async (id, descripcion) => {
  const query = 'UPDATE cat_tipo_actividad SET descripcion = $1 WHERE id_tipo = $2 RETURNING *;';
  const resultado = await pool.query(query, [descripcion, id]);
  return resultado.rows[0] || null;
};

// Eliminar un tipo de actividad por ID
const deleteTipoActividad = async (id) => {
  const query = 'DELETE FROM cat_tipo_actividad WHERE id_tipo = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

module.exports = {
  getAllTiposActividad,
  insertTipoActividad,
  updateTipoActividad,
  deleteTipoActividad
};